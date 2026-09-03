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

// vip等级0-普通用户 1-VIP试用,100-VIP用户
export enum VIP_CODE {
  '普通' = 0,
  'VIP试用' = 1,
  'VIP用户' = 100,
}

// 申请状态 1-待审批，2-审批通过，3-审批不通过
export enum VIP_APPLICATION_STATUS {
  '待审批' = 1,
  '审批通过' = 2,
  '审批不通过' = 3,
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
