export const PARTNER_BIZ_ROLE_OPTIONS = [
  { value: 'BRAND', label: '品牌方' },
  { value: 'FUNDER', label: '资方' },
  { value: 'SECONDARY', label: '二批主体' },
  { value: 'INTERNAL', label: '鲜牧内部主体' }
]

export const PRICE_TYPE_OPTIONS = [
  { value: 1, label: '采购价' },
  { value: 2, label: '销售价' }
]

export const ORDER_STATUS_OPTIONS = [
  { value: 0, label: '草稿' },
  { value: 1, label: '已完成' }
]

export const PAYMENT_STATUS_OPTIONS = [
  { value: 0, label: '未支付' },
  { value: 1, label: '部分支付' },
  { value: 2, label: '已支付' }
]

export const INVOICE_STATUS_OPTIONS = [
  { value: 0, label: '未开票' },
  { value: 1, label: '部分开票' },
  { value: 2, label: '已开票' }
]

export const BIZ_TYPE_OPTIONS = [
  { value: 'PURCHASE_INBOUND', label: '采购入库' },
  { value: 'PRESALE', label: '预销售' },
  { value: 'NORMAL_OUTBOUND', label: '正常赎单/出库' },
  { value: 'LOSS_OUTBOUND', label: '损耗赎单' }
]

export const WAREHOUSE_TYPE_OPTIONS = [
  { value: 'PORT_COLD', label: '港口冷链仓' },
  { value: 'COLD', label: '冷链仓' },
  { value: 'NORMAL', label: '普通仓' }
]

export const FEE_UNIT_OPTIONS = [
  { value: 'PIECE', label: '按件' },
  { value: 'WEIGHT', label: '按重量' },
  { value: 'ORDER', label: '按单' }
]

export const CURRENCY_OPTIONS = [
  { value: 'CNY', label: 'CNY' },
  { value: 'USD', label: 'USD' }
]

export function getOptionLabel (options, value) {
  const target = options.find(item => item.value === value)
  return target ? target.label : ''
}

export function getMultiOptionLabel (options, value) {
  if (!value) {
    return ''
  }
  return value
    .split(',')
    .map(item => item.trim())
    .map(item => getOptionLabel(options, item))
    .filter(Boolean)
    .join(' / ')
}

export function money (value, digits = 2) {
  const amount = Number(value || 0)
  return amount.toFixed(digits)
}

export function toDate (value) {
  return value ? new Date(value) : null
}
