import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DragDropList = ({
  data = [],
  renderItem,
  onReorder,
  keyExtractor,
  enabled = true,
  contentContainerStyle,
  style,
  itemHeight = 80,
  scrollEnabled = true,
}) => {
  const [dragging, setDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(-1);
  const scrollY = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const itemOffset = useRef(new Animated.Value(0)).current;

  const getItemIndex = (gestureY) => {
    return Math.floor(gestureY / itemHeight);
  };

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: dragY } }],
    { useNativeDriver: false }
  );

  const handleStateChange = (event, index) => {
    if (!enabled) return;

    const { state, translationY } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        setDragging(true);
        setDraggedIndex(index);
        itemOffset.setValue(index * itemHeight);
        break;

      case State.ACTIVE:
        // Auto scroll when dragging near edges
        if (translationY < 50) {
          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, scrollY._value - 10),
            animated: true,
          });
        } else if (translationY > SCREEN_HEIGHT - 50) {
          flatListRef.current?.scrollToOffset({
            offset: scrollY._value + 10,
            animated: true,
          });
        }
        break;

      case State.END:
      case State.CANCELLED:
        if (dragging && draggedIndex !== -1) {
          const newIndex = getItemIndex(itemOffset._value + translationY);
          const clampedNewIndex = Math.max(0, Math.min(data.length - 1, newIndex));
          
          if (clampedNewIndex !== draggedIndex && onReorder) {
            onReorder(draggedIndex, clampedNewIndex);
          }
        }
        
        // Reset animation
        Animated.parallel([
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: false,
          }),
          Animated.spring(itemOffset, {
            toValue: 0,
            useNativeDriver: false,
          }),
        ]).start();

        setDragging(false);
        setDraggedIndex(-1);
        break;
    }
  };

  const renderDraggableItem = ({ item, index }) => {
    const isDragged = dragging && index === draggedIndex;
    
    const animatedStyle = isDragged
      ? {
          transform: [
            {
              translateY: Animated.add(
                itemOffset,
                dragY
              ),
            },
          ],
          zIndex: 1000,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }
      : {};

    const itemStyle = [
      styles.itemContainer,
      { height: itemHeight },
      isDragged && styles.draggedItem,
      animatedStyle,
    ];

    if (!enabled) {
      return (
        <View style={[styles.itemContainer, { height: itemHeight }]}>
          {renderItem({ item, index, dragHandle: false })}
        </View>
      );
    }

    return (
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={(event) => handleStateChange(event, index)}
        enabled={enabled}
      >
        <Animated.View style={itemStyle}>
          {renderItem({ item, index, dragHandle: true })}
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <View style={[styles.container, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderDraggableItem}
        keyExtractor={keyExtractor}
        scrollEnabled={scrollEnabled && !dragging}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.contentContainer,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        getItemLayout={(data, index) => ({
          length: itemHeight,
          offset: itemHeight * index,
          index,
        })}
      />
      
      {dragging && (
        <View style={styles.dragOverlay} pointerEvents="none" />
      )}
    </View>
  );
};

// Alternative simplified version for basic reordering with buttons
export const SimpleDragDropList = ({
  data = [],
  renderItem,
  onReorder,
  keyExtractor,
  enabled = true,
  style,
}) => {
  const [listData, setListData] = useState(data);

  React.useEffect(() => {
    setListData(data);
  }, [data]);

  const moveItem = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    
    const newData = [...listData];
    const [movedItem] = newData.splice(fromIndex, 1);
    newData.splice(toIndex, 0, movedItem);
    
    setListData(newData);
    
    if (onReorder) {
      onReorder(fromIndex, toIndex);
    }
  };

  const renderDraggableItem = ({ item, index }) => (
    <View style={styles.simpleItemContainer}>
      <View style={styles.simpleItemContent}>
        {renderItem({ item, index, dragHandle: false })}
      </View>
      {enabled && (
        <View style={styles.simpleControlButtons}>
          {index > 0 && (
            <TouchableOpacity 
              style={styles.moveButton}
              onPress={() => moveItem(index, index - 1)}
            >
              <Ionicons name="chevron-up" size={16} color="#666" />
            </TouchableOpacity>
          )}
          {index < listData.length - 1 && (
            <TouchableOpacity 
              style={styles.moveButton}
              onPress={() => moveItem(index, index + 1)}
            >
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={[styles.container, style]}
      data={listData}
      renderItem={renderDraggableItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: 'transparent',
  },
  draggedItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  dragOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  simpleItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  simpleItemContent: {
    flex: 1,
  },
  simpleControlButtons: {
    flexDirection: 'column',
    paddingHorizontal: 8,
  },
  moveButton: {
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginVertical: 2,
  },
});

export default DragDropList;