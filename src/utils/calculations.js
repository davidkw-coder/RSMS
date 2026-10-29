export const PASS_MARK = 50

export const GRADE_BANDS = [
  { grade: 'A', label: 'Excellent', min: 80, color: '#32C875' },
  { grade: 'B', label: 'Very good', min: 70, color: '#9670E8' },
  { grade: 'C', label: 'Good', min: 60, color: '#0865B5' },
  { grade: 'D', label: 'Pass', min: PASS_MARK, color: '#FFC94A' },
  { grade: 'F', label: 'Needs support', min: 0, color: '#F04444' },
]

export function getStudentAverage(student) {
  const marks = (student.subjects || [])
    .filter((subject) => String(subject.mark).trim() !== '')
    .map((subject) => Number(subject.mark))
    .filter((mark) => Number.isFinite(mark) && mark >= 0 && mark <= 100)

  if (!marks.length) return null
  return marks.reduce((total, mark) => total + mark, 0) / marks.length
}

export function getGrade(score) {
  if (score === null || !Number.isFinite(score)) return null
  return GRADE_BANDS.find((band) => score >= band.min)?.grade || 'F'
}

export function getStatistics(students) {
  const scored = students
    .map((student) => ({ student, average: getStudentAverage(student) }))
    .filter(({ average }) => average !== null)
  const distribution = GRADE_BANDS.map((band) => ({
    name: `Grade ${band.grade}`,
    grade: band.grade,
    value: scored.filter(({ average }) => getGrade(average) === band.grade).length,
    color: band.color,
  }))

  return {
    total: students.length,
    scored: scored.length,
    passed: scored.filter(({ average }) => average >= PASS_MARK).length,
    failed: scored.filter(({ average }) => average < PASS_MARK).length,
    average: scored.length
      ? scored.reduce((total, item) => total + item.average, 0) / scored.length
      : null,
    distribution,
  }
}

export function formatScore(score) {
  return score === null || !Number.isFinite(score) ? 'Not graded' : `${score.toFixed(1)}%`
}