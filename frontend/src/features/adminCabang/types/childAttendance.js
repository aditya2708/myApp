/**
 * @typedef {Object} ChildAttendanceSummary
 * @property {number} total_children
 * @property {number} total_shelters
 * @property {number} total_groups
 * @property {number} total_sessions
 * @property {number} present_count
 * @property {number} late_count
 * @property {number} absent_count
 * @property {string|number} attendance_percentage
 * @property {number} low_band_children
 */

/**
 * @typedef {Object} ChildAttendanceShelterBreakdown
 * @property {number|string} id
 * @property {string} name
 * @property {string} [wilbin]
 * @property {number} total_children
 * @property {number} present_count
 * @property {number} late_count
 * @property {number} absent_count
 * @property {string|number} attendance_percentage
 * @property {string} [attendance_band]
 * @property {string|number} [trend_delta]
 * @property {number} [low_band_children]
 */

/**
 * @typedef {Object} ChildAttendanceMonthlyBreakdown
 * @property {string} month
 * @property {string} [label]
 * @property {number} activities_count
 * @property {number} attended_count
 * @property {number} [late_count]
 * @property {number} [absent_count]
 * @property {string|number} attendance_percentage
 */

/**
 * @typedef {Object} ChildAttendanceLastActivity
 * @property {number|string} activity_id
 * @property {string} date
 * @property {string} activity_name
 * @property {string} status
 * @property {string|null} [verified_at]
 */

/**
 * @typedef {Object} ChildAttendanceStreaks
 * @property {number} [current_present_streak]
 * @property {number} [longest_present_streak]
 * @property {string|null} [last_absent_on]
 */

/**
 * @typedef {Object} ChildAttendanceItem
 * @property {number|string} id
 * @property {string} full_name
 * @property {string} [nick_name]
 * @property {string|null} [photo_url]
 * @property {{ id: number|string, name: string }} shelter
 * @property {{ id: number|string, name: string }} [group]
 * @property {{
 *   present_count: number,
 *   late_count: number,
 *   absent_count: number,
 *   total_sessions: number,
 *   attendance_percentage: string|number,
 *   attendance_band?: string,
 * }} attendance
 * @property {ChildAttendanceMonthlyBreakdown[]} [monthly_breakdown]
 * @property {ChildAttendanceLastActivity|null} [last_activity]
 * @property {ChildAttendanceStreaks} [streaks]
 * @property {Array<{ type: string, label: string }>} [flags]
 */

/**
 * @typedef {Object} ChildAttendanceFilters
 * @property {string|null} [start_date]
 * @property {string|null} [end_date]
 * @property {string|null} [search]
 * @property {string|null|number} [attendance_band]
 * @property {string|null|number} [shelter_id]
 * @property {string|null|number} [group_id]
 * @property {number} [page]
 * @property {number} [per_page]
 */

export default {};
