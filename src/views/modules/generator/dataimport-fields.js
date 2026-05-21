export const FORM_GROUPS = [
  {
    title: '基础信息',
    fields: [
      { prop: 'item', label: 'Item' },
      { prop: 'channel', label: 'Channel' },
      { prop: 'retailer', label: 'Retailer' },
      { prop: 'subChannel', label: 'Sub Channel' },
      { prop: 'customer', label: 'Customer' },
      { prop: 'customerRegion', label: 'Customer Region' },
      { prop: 'province', label: 'Province' },
      { prop: 'cityTier', label: 'City Tier' },
      { prop: 'city1', label: 'City1' },
      { prop: 'city2', label: 'City2' },
      { prop: 'location', label: 'Location' },
      { prop: 'date', label: 'Date' },
      { prop: 'year', label: 'Year' },
      { prop: 'month', label: 'Month' },
      { prop: 'day', label: 'Day' }
    ]
  },
  {
    title: '门店信息',
    fields: [
      { prop: 'storeCodeCustomer', label: 'Store Code-Customer' },
      { prop: 'storeCodeSff', label: 'Store Code-SFF' },
      { prop: 'storeName', label: 'Store Name' },
      { prop: 'chainStoreOrNot', label: 'Chain Store or not' },
      { prop: 'strongHold', label: 'Strong hold' },
      { prop: 'battleField', label: 'Battle Field' },
      { prop: 'greenSpace', label: 'Green space' },
      { prop: 'distributeFromWhichDc', label: 'Distribute from which DC' },
      { prop: 'storeStatus', label: 'Store Status' },
      { prop: 'active', label: 'Active' },
      { prop: 'inactive', label: 'Inactive' },
      { prop: 'attrited', label: 'Attrited' },
      { prop: 'closed', label: 'Closed' },
      { prop: 'storeClassification', label: 'Store classification' }
    ]
  },
  {
    title: '陈列与人员',
    fields: [
      { prop: 'display', label: 'Display' },
      { prop: 'cooler', label: 'Cooler' },
      { prop: 'frozenArea', label: 'Frozen Area' },
      { prop: 'posm', label: 'POSM' },
      { prop: 'salesPromoter', label: 'Sales Promoter' },
      { prop: 'tasting', label: 'Tasting' },
      { prop: 'kam', label: 'KAM' },
      { prop: 'f', label: 'F(>=50K/Month)' },
      { prop: 'a', label: 'A(>=20K/Month)' },
      { prop: 'b', label: 'B(>=10K/Month)' },
      { prop: 'c', label: 'C(>3K/Month)' },
      { prop: 'd', label: 'D(<=3K/Month)' }
    ]
  },
  {
    title: '品牌与品类',
    fields: [
      { prop: 'productBrand', label: 'Product Brand' },
      { prop: 'firstParty', label: 'First Party(SFF)' },
      { prop: 'coBrand', label: 'Co-Brand' },
      { prop: 'customerBrand', label: 'Customer brand' },
      { prop: 'productCategories', label: 'Product Categories' },
      { prop: 'frozenBeef', label: 'Frozen Beef' },
      { prop: 'chilledPs', label: 'Chilled PS' },
      { prop: 'syb', label: 'SYB' },
      { prop: 'frozenLamb', label: 'Frozen Lamb' },
      { prop: 'chilledLamb', label: 'Chilled Lamb' },
      { prop: 'venison', label: 'Venison' },
      { prop: 'angus', label: 'Angus' },
      { prop: 'reserve', label: 'Reserve' }
    ]
  },
  {
    title: '包装与SKU',
    fields: [
      { prop: 'productPackage', label: 'Product Package' },
      { prop: 'entry', label: 'Entry(<1KG)' },
      { prop: 'uprise', label: 'Uprise(1-2KG)' },
      { prop: 'scale', label: 'Scale(>2KG)' },
      { prop: 'giftPack', label: 'Gift Pack' },
      { prop: 'noOfSku', label: 'No. of SKU' },
      { prop: 'customerSkuDescription', label: 'Customer SKU description' },
      { prop: 'skuDescription', label: 'SKU Description' },
      { prop: 'packSize', label: 'Pack Size(g)' },
      { prop: 'claimRate', label: 'Claim Rate' }
    ]
  },
  {
    title: '单品明细',
    fields: [
      { prop: 'beefCube500g', label: 'Beef Cube 500g' },
      { prop: 'beefHotpotRoll200g', label: 'Beef Hotpot Roll 200g' },
      { prop: 'beefMince500g', label: 'Beef Mince 500g' },
      { prop: 'beefShankMeat1000g', label: 'Beef Shank Meat 1000g' },
      { prop: 'beefTail500g', label: 'Beef Tail 500g' },
      { prop: 'lambCubeBoneIn500g', label: 'Lamb Cube Bone-in 500g' },
      { prop: 'lambFrenchRack200g', label: 'Lamb French Rack 200g' },
      { prop: 'lambLegSteak1000g', label: 'Lamb Leg steak 1000g' },
      { prop: 'nebInStoreWeighing', label: 'NEB In-store Weighing' },
      { prop: 'psBeefFlatInStoreWeighing', label: 'PS Beef Flat In-store Weighing' },
      { prop: 'ribEyeSteak150g', label: 'Rib Eye Steak 150g' },
      { prop: 'ribEyeSteak500g', label: 'Rib Eye Steak 500g' },
      { prop: 'striploinSteak150g', label: 'Striploin Steak 150g' },
      { prop: 'striploinSteak500g', label: 'Striploin Steak 500g' },
      { prop: 'venisonFlapCubes1000g', label: 'Venison Flap Cubes 1000g' },
      { prop: 'venisonFlapCubes400g', label: 'Venison Flap Cubes 400g' },
      { prop: 'venisonShankMeat800g', label: 'Venison Shank Meat 800g' },
      { prop: 'venisonFrenchRacks1000g', label: 'Venison French Racks 1000g' },
      { prop: 'venisonFrenchRacks450g', label: 'Venison French Racks 450g' },
      { prop: 'venisonRibs500g', label: 'Venison Ribs 500g' },
      { prop: 'venisonShank800g', label: 'Venison Shank 800g' },
      { prop: 'venisonStriploin150g', label: 'Venison Striploin 150g' },
      { prop: 'chilledLambFrRackWeighting', label: 'Chilled Lamb Fr. Rack-Weighting' },
      { prop: 'venisonGiftBox', label: 'Venison Gift Box' },
      { prop: 'lambCcs', label: 'Lamb CCS' }
    ]
  },
  {
    title: '销售数据',
    fields: [
      { prop: 'salesValue', label: 'Sales Value' },
      { prop: 'salesWeight', label: 'Sales Weight' },
      { prop: 'salesQty', label: 'Sales Qty(PC)' }
    ]
  }
]

export const FORM_FIELDS = FORM_GROUPS.reduce((fields, group) => fields.concat(group.fields), [])

export const TABLE_COLUMNS = [
  { prop: 'item', label: 'Item', minWidth: 140 },
  { prop: 'channel', label: 'Channel', minWidth: 120 },
  { prop: 'retailer', label: 'Retailer', minWidth: 140 },
  { prop: 'storeCodeCustomer', label: 'Store Code-Customer', minWidth: 150 },
  { prop: 'storeCodeSff', label: 'Store Code-SFF', minWidth: 150 },
  { prop: 'storeName', label: 'Store Name', minWidth: 180 },
  { prop: 'customer', label: 'Customer', minWidth: 120 },
  { prop: 'province', label: 'Province', minWidth: 110 },
  { prop: 'date', label: 'Date', minWidth: 110 },
  { prop: 'salesValue', label: 'Sales Value', minWidth: 110 },
  { prop: 'salesWeight', label: 'Sales Weight', minWidth: 110 },
  { prop: 'salesQty', label: 'Sales Qty', minWidth: 110 },
  { prop: 'createTime', label: '导入时间', minWidth: 180 }
]

export function createDefaultForm () {
  const form = {
    id: 0,
    status: 1
  }
  FORM_FIELDS.forEach(field => {
    form[field.prop] = ''
  })
  return form
}
