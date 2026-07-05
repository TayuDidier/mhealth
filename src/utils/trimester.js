export function getTrimester(week) {
  if (week <= 13) return 1
  if (week <= 26) return 2
  return 3
}

export function trimesterLabel(week) {
  const t = getTrimester(week)
  return t === 1 ? '1st Trimester' : t === 2 ? '2nd Trimester' : '3rd Trimester'
}

export function weeklyTip(week) {
  const tips = {
    4:  'Your baby is the size of a poppy seed. Start taking folic acid if you haven\'t already.',
    8:  'Morning sickness is common now. Try small, frequent meals and ginger tea.',
    12: 'End of first trimester! Risk of miscarriage drops significantly.',
    16: 'You may start to feel your baby move — called quickening.',
    20: 'Halfway there! Your baby can now hear sounds from outside the womb.',
    24: 'Stay hydrated and keep up gentle exercise like walking or prenatal yoga.',
    28: 'Third trimester begins! Your baby\'s lungs are developing rapidly.',
    32: 'Start preparing your birth plan and hospital bag.',
    36: 'Your baby is almost ready. Attend all antenatal checks.',
    40: 'Full term! Watch for signs of labour and contact your provider if concerned.',
  }
  const keys = Object.keys(tips).map(Number).sort((a, b) => a - b)
  const closest = keys.reduce((prev, curr) => Math.abs(curr - week) < Math.abs(prev - week) ? curr : prev)
  return tips[closest]
}

export function daysUntilDue(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const now = new Date()
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  return diff
}
