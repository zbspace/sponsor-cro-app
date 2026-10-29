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

// 试验状态 value
export enum TRIAL_STATUS_VALUES {
  '进行中' = '进行中',
  '已完成' = '已完成',
  '主动暂停' = '主动暂停',
  '被叫停' = '被叫中'
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

// 试验分期 value
export enum TRIAL_PHASE_VALUES {
  'Ⅰ期' = 'Ⅰ期',
  'Ⅱ期' = 'Ⅱ期',
  'Ⅲ期' = 'Ⅲ期',
  'Ⅳ期' = 'Ⅳ期',
  'BE' = 'BE',
  '其他' = '其他'
}

// vip等级0-普通用户 1-VIP试用,100-VIP用户
export enum VIP_CODE {
  '普通' = 0,
  'VIP试用' = 1,
  'VIP用户' = 100
}

// 申请状态 1-待审批，2-审批通过，3-审批不通过
export enum VIP_APPLICATION_STATUS {
  '待审批' = 1,
  '审批通过' = 2,
  '审批不通过' = 3
}

// 会员申请状态 0-未申请，1-申请试用中，2-试用中，3-申请开通中，4-开通中
export enum APPLY_STATUS {
  '未申请' = 0,
  '申请试用中' = 1,
  '试用中' = 2,
  '申请开通中' = 3,
  '开通中' = 4
}

// 注册类型
export enum REGISTER_TYPE {
  '1类' = '1类',
  '2类' = '2类',
  '3类' = '3类',
  '4类' = '4类',
  '5类' = '5类'
}

// 注册类型 int
export enum REGISTER_TYPE_VALUES_INT {
  '1类' = 1,
  '2类' = 2,
  '3类' = 3,
  '4类' = 4,
  '5类' = 5
}

// 药品类型
export enum DRUG_TYPE_VALUES {
  '化药' = '化药',
  '疫苗' = '疫苗',
  '治疗生物药' = '治疗生物药',
  '中药' = '中药'
}

// 药品类型 int
export enum DRUG_TYPE_VALUES_INT {
  '化药' = 1,
  '疫苗' = 2,
  '治疗生物药' = 3,
  '中药' = 4
}

// 将枚举转换为选项数组（{ value: 编码, text: 文案 }）
// value 支持字符串与数字编码（如 DRUG_TYPE_VALUES_INT）
export function createEnumsToOptions<T extends Record<string, string | number>>(
  enumObj: T
): { value: T[keyof T]; text: string }[] {
  return (Object.keys(enumObj) as Array<keyof T>).map((key) => ({
    value: enumObj[key],
    text: key as string
  }))
}
