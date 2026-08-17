// 试验状态（文案 -> 编码）
export enum TRIAL_STATUS {
  '进行中-尚未招募' = '1',
  '进行中-招募中' = '2',
  '进行中-招募完成' = '3',
  '已完成' = '4',
  '主动暂停/终止' = '5',
  'IEC/IRB暂停/终止' = '6',
  '责令暂停/终止' = '7'
}

// 试验分期（文案 -> 编码）
export enum TRIAL_PHASE {
  'Ⅰ期' = '1',
  'Ⅱ期' = '2',
  'Ⅲ期' = '3',
  'Ⅳ期' = '4',
  'BE' = '5',
  '其他' = '6'
}

// 将枚举转换为选项数组（{ value: 编码, text: 文案 }）
export function createEnumsToOptions<T extends Record<string, string>>(
  enumObj: T
): { value: string; text: string }[] {
  return (Object.keys(enumObj) as Array<keyof T>).map((key) => ({
    value: enumObj[key],
    text: key as string
  }))
}
