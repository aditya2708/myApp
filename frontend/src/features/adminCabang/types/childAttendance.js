/**
 * Summary metrics returned by the child attendance report endpoints.
 * @typedef {Object} ChildAttendanceSummary
 * @property {{ start: string|null, end: string|null, label: string|null }} dateRange -
 *   Normalized date range for the aggregated period.
 * @property {{ value: number, label: string }} attendanceRate - Percentage value and localized label.
 * @property {number} totalChildren - Total children included in the summary.
 * @property {number} activeChildren - Number of active/participating children, if available.
 * @property {number} totalSessions - Total counted attendance sessions.
 * @property {{ present: number, late: number, absent: number }} breakdown - Session breakdown per status.
 * @property {{ verified: number, pending: number, rejected: number }} verification - Verification statistics for the same period.
 */

/**
 * Normalized shelter level breakdown for the child attendance report.
 * @typedef {Object} ChildAttendanceShelterBreakdown
 * @property {string|number|null} id - Shelter identifier when provided by the API.
 * @property {string} name - Display name for the shelter.
 * @property {{ value: number, label: string }} attendanceRate - Attendance percentage with formatted label.
 * @property {number} totalChildren - Children counted within the shelter.
 * @property {{ present: number, late: number, absent: number }} breakdown - Attendance breakdown scoped to the shelter.
 */

/**
 * Representation of each child item rendered on the attendance report list.
 * @typedef {Object} ChildAttendanceChildItem
 * @property {string|number|null} id - Child identifier.
 * @property {string} name - Child full name.
 * @property {string|null} identifier - Optional child code/identifier.
 * @property {{ id: string|number|null, name: string|null }} shelter - Shelter metadata for the child.
 * @property {{ id: string|number|null, name: string|null }} group - Group/kelompok metadata for the child.
 * @property {{ value: number, label: string }} attendanceRate - Attendance percentage with formatted label.
 * @property {{ present: number, late: number, absent: number, totalSessions: number }} totals - Aggregated attendance counts for the child.
 * @property {{ verified: number, pending: number, rejected: number }} verification - Verification statistics tied to the child.
 * @property {string|null} lastAttendanceDate - ISO date string for the latest attendance entry.
 * @property {string|null} lastAttendanceStatus - Last attendance status code when available.
 */

/**
 * Monthly attendance breakdown entry for child attendance detail view.
 * @typedef {Object} ChildAttendanceMonthlyBreakdown
 * @property {string|null} id - Unique identifier for the entry (often the month).
 * @property {string|null} label - Localized month label used in the UI.
 * @property {{ value: number, label: string }} attendanceRate - Attendance percentage for the month.
 * @property {{ present: number, late: number, absent: number, totalSessions: number }} totals - Monthly attendance totals.
 */

/**
 * Streak statistics used to surface consistency information about a child.
 * @typedef {Object} ChildAttendanceStreak
 * @property {string|null} id - Identifier for the streak entry.
 * @property {string|null} type - Type/category of the streak (e.g. "present", "absent").
 * @property {string|null} label - Localized label describing the streak.
 * @property {number} value - Numeric value associated with the streak (e.g. number of days).
 * @property {{ value: number, label: string }} percentage - Optional percentage metric related to the streak.
 * @property {{ start: string|null, end: string|null }} dateRange - Date range covered by the streak.
 */

/**
 * Active filters applied to the child attendance report list.
 * @typedef {Object} ChildAttendanceFilters
 * @property {string} search - Search keyword applied to the list.
 * @property {string|null} band - Attendance band filter value.
 * @property {string|number|null} shelterId - Selected shelter identifier.
 * @property {string|number|null} groupId - Selected group identifier.
 * @property {string|null} startDate - Applied start date filter (ISO 8601, YYYY-MM-DD).
 * @property {string|null} endDate - Applied end date filter (ISO 8601, YYYY-MM-DD).
 */

export {}; // The file only provides shared JSDoc typedefs.
