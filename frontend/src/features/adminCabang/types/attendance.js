/**
 * Weekly attendance period information shared across the admin cabang reports.
 * @typedef {Object} WeeklyAttendancePeriod
 * @property {string|null} id - Identifier for the period or week, if available.
 * @property {string|null} label - Human readable label for the period (e.g. "Minggu 1").
 * @property {{ start: string|null, end: string|null, label: string|null }} dateRange -
 *   Normalized date range for the period. Individual values can be null when not supplied.
 */

/**
 * Normalized summary metric returned by the weekly attendance endpoints.
 * @typedef {Object} WeeklyAttendanceSummary
 * @property {number|null} attendanceRate - Percentage (0-100) for the attendance rate.
 * @property {{ count: number|null, percentage: number|null }} summary.present - Present statistics.
 * @property {{ count: number|null, percentage: number|null }} summary.late - Late statistics.
 * @property {{ count: number|null, percentage: number|null }} summary.absent - Absent statistics.
 * @property {{ verified: number|null, pending: number|null, rejected: number|null }} verification -
 *   Verification breakdown for the selected period.
 * @property {{ sessions: number|null }} totals - Aggregated totals for the period.
 * @property {{ start: string|null, end: string|null, label: string|null }} dates -
 *   Alias to the period date range to keep backwards compatibility with UI components.
 */

/**
 * Card data rendered on the weekly attendance dashboard for each shelter.
 * @typedef {Object} WeeklyAttendanceShelterCard
 * @property {string|number} id - Shelter identifier.
 * @property {string} name - Display name.
 * @property {string|number|null|Object} wilbin - Optional wilayah binaan metadata or label.
 * @property {number|null} attendanceRate - Attendance percentage used for banding.
 * @property {WeeklyAttendanceSummary['summary']} summary - Attendance breakdown for the shelter.
 * @property {WeeklyAttendanceSummary['verification']} verification - Verification breakdown.
 * @property {number|null} totalSessions - Total sessions counted within the period.
 * @property {string|null} band - Server provided band label, if supplied.
 */

/**
 * Card data for the list of groups within a shelter weekly detail response.
 * @typedef {Object} WeeklyAttendanceGroupCard
 * @property {string|number} id - Group identifier.
 * @property {string} name - Display name.
 * @property {string|null} mentor - Mentor/teacher name.
 * @property {number|null} membersCount - Number of members in the group.
 * @property {number|null} attendanceRate - Attendance percentage for the group.
 * @property {WeeklyAttendanceSummary['summary']} summary - Attendance breakdown.
 */

/**
 * Normalized student record returned from the group students endpoint.
 * @typedef {Object} WeeklyAttendanceStudent
 * @property {string|number} id - Attendance entry identifier.
 * @property {string} name - Student name.
 * @property {string|null} identifier - Student identifier/code.
 * @property {string|null} status - Status code returned by the server.
 * @property {string|null} statusLabel - Human readable status label.
 * @property {string|null} statusIcon - Optional icon name consumed by the UI.
 * @property {string|null} statusColor - Optional color string used for the chip.
 * @property {string|null} timeLabel - Formatted time string for the attendance entry.
 * @property {string|null} note - Additional note or remark.
 */

export {}; // The file only provides shared JSDoc typedefs.

