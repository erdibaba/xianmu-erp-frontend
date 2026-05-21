<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="1200px"
    top="4vh">
    <div class="trade-order-dialog">
      <el-form :model="dataForm" ref="dataForm" label-width="100px">
        <el-card shadow="never">
          <div slot="header">单据头</div>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="单号">
                <el-input v-model="dataForm.orderNo" :disabled="readonly" placeholder="留空自动生成"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="往来单位">
                <el-select v-model="dataForm.partnerId" filterable :disabled="readonly" placeholder="请选择单位" style="width: 100%;">
                  <el-option
                    v-for="item in filteredPartnerList"
                    :key="item.id"
                    :label="item.partnerName"
                    :value="item.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="品牌方">
                <el-select v-model="dataForm.brandId" filterable clearable :disabled="readonly" placeholder="请选择品牌方" style="width: 100%;">
                  <el-option
                    v-for="item in brandPartnerList"
                    :key="'brand-' + item.id"
                    :label="item.partnerName"
                    :value="item.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="状态">
                <el-select v-model="dataForm.status" :disabled="readonly" style="width: 100%;">
                  <el-option
                    v-for="item in orderStatusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="二批主体">
                <el-select v-model="dataForm.secondaryPartnerId" filterable clearable :disabled="readonly" placeholder="请选择二批主体" style="width: 100%;">
                  <el-option
                    v-for="item in secondaryPartnerList"
                    :key="'secondary-' + item.id"
                    :label="item.partnerName"
                    :value="item.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="资方">
                <el-select v-model="dataForm.funderId" filterable clearable :disabled="readonly" placeholder="请选择资方" style="width: 100%;">
                  <el-option
                    v-for="item in funderPartnerList"
                    :key="'funder-' + item.id"
                    :label="item.partnerName"
                    :value="item.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="业务类型">
                <el-select v-model="dataForm.bizType" :disabled="readonly || lockBizType" style="width: 100%;">
                  <el-option
                    v-for="item in bizTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="订单日期">
                <el-date-picker v-model="dataForm.orderDate" type="datetime" :disabled="readonly" style="width: 100%;"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="预计日期">
                <el-date-picker v-model="dataForm.expectedDate" type="datetime" :disabled="readonly" style="width: 100%;"></el-date-picker>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="付款截止">
                <el-date-picker v-model="dataForm.paymentDueDate" type="datetime" :disabled="readonly" style="width: 100%;"></el-date-picker>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="合同号">
                <el-input v-model="dataForm.contractNo" :disabled="readonly"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="关联合同号">
                <el-input v-model="dataForm.relatedContractNo" :disabled="readonly"></el-input>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="柜号">
                <el-input v-model="dataForm.containerNo" :disabled="readonly"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="仓库">
                <el-select
                  v-model="dataForm.warehouseId"
                  filterable
                  clearable
                  :disabled="readonly"
                  placeholder="请选择仓库"
                  style="width: 100%;"
                  @change="handleWarehouseChange">
                  <el-option
                    v-for="item in warehouseList"
                    :key="item.id"
                    :label="item.warehouseName"
                    :value="item.id">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="币种">
                <el-select v-model="dataForm.currency" :disabled="readonly" style="width: 100%;">
                  <el-option
                    v-for="item in currencyOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="付款状态">
                <el-select v-model="dataForm.paymentStatus" :disabled="readonly" style="width: 100%;">
                  <el-option
                    v-for="item in paymentStatusOptions"
                    :key="'payment-' + item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开票状态">
                <el-select v-model="dataForm.invoiceStatus" :disabled="readonly" style="width: 100%;">
                  <el-option
                    v-for="item in invoiceStatusOptions"
                    :key="'invoice-' + item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开始计仓日期">
                <el-date-picker v-model="dataForm.storageStartDate" type="datetime" :disabled="readonly" style="width: 100%;"></el-date-picker>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="免仓天数">
                <el-input v-model.number="dataForm.storageFeeStartDays" :disabled="readonly"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="自动赎单">
                <el-switch v-model="dataForm.autoOutbound" :disabled="readonly || dataForm.bizType !== 'PRESALE'" :active-value="1" :inactive-value="0"></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8" v-if="dataForm.sourceOrderNo">
              <el-form-item label="来源单号">
                <el-input v-model="dataForm.sourceOrderNo" disabled></el-input>
              </el-form-item>
            </el-col>

            <el-col :span="16">
              <el-form-item label="备注">
                <el-input v-model="dataForm.remark" type="textarea" :disabled="readonly" :rows="2"></el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card shadow="never" class="block-card">
          <div slot="header" class="card-header">
            <span>明细行</span>
            <el-button v-if="!readonly" size="mini" type="primary" @click="addItemRow()">新增明细</el-button>
          </div>
          <el-table :data="dataForm.itemList" border size="mini">
            <el-table-column label="#" width="50" align="center">
              <template slot-scope="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="产品" min-width="220">
              <template slot-scope="scope">
                <el-select v-model="scope.row.productId" filterable :disabled="readonly" placeholder="选择产品" style="width: 100%;" @change="productChangeHandle(scope.row)">
                  <el-option
                    v-for="item in productList"
                    :key="item.id"
                    :label="item.productName + ' / ' + item.productCode"
                    :value="item.id">
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="规格" min-width="120">
              <template slot-scope="scope">{{ scope.row.productSpec }}</template>
            </el-table-column>
            <el-table-column label="仓库" min-width="140">
              <template slot-scope="scope">
                <span>{{ scope.row.warehouseName || currentWarehouseName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="批次" min-width="110">
              <template slot-scope="scope">
                <el-input v-model="scope.row.batchNo" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.quantity" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="件数" width="90">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.pieceCount" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="实际件数" width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.actualPieceCount" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="预计重量" width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.estimatedWeight" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="实际入库重" width="110">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.actualInWeight" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="实际出库重" width="110">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.actualOutWeight" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="亏损重量" width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.lossWeight" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="未税单价" width="110">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.unitPrice" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="税率(%)" width="90">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.taxRate" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="110" align="right">
              <template slot-scope="scope">{{ lineAmount(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="税额" width="110" align="right">
              <template slot-scope="scope">{{ lineTax(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="价税合计" width="110" align="right">
              <template slot-scope="scope">{{ lineTotal(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="备注" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remark" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="保鲜到期" min-width="140">
              <template slot-scope="scope">
                <el-date-picker v-model="scope.row.expiryDate" type="date" :disabled="readonly" style="width: 100%;"></el-date-picker>
              </template>
            </el-table-column>
            <el-table-column v-if="!readonly" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeItemRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card shadow="never" class="block-card">
          <div slot="header" class="card-header">
            <span>费用行</span>
            <el-button v-if="!readonly" size="mini" type="primary" @click="addExpenseRow()">新增费用</el-button>
          </div>
          <el-table :data="dataForm.expenseList" border size="mini">
            <el-table-column label="#" width="50" align="center">
              <template slot-scope="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="费用类型" min-width="120">
              <template slot-scope="scope">
                <el-input v-model="scope.row.expenseType" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="费用名称" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.expenseName" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.amount" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="税率(%)" width="90">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.taxRate" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="税额" width="110" align="right">
              <template slot-scope="scope">{{ expenseTax(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="价税合计" width="110" align="right">
              <template slot-scope="scope">{{ expenseTotal(scope.row) }}</template>
            </el-table-column>
            <el-table-column label="备注" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remark" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column v-if="!readonly" label="操作" width="80" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeExpenseRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-row :gutter="20" class="summary-row">
          <el-col :span="6"><div class="summary-item">货款金额：{{ itemAmount }}</div></el-col>
          <el-col :span="6"><div class="summary-item">费用金额：{{ expenseAmount }}</div></el-col>
          <el-col :span="6"><div class="summary-item">税额合计：{{ taxAmount }}</div></el-col>
          <el-col :span="6"><div class="summary-item total">总金额：{{ totalAmount }}</div></el-col>
        </el-row>
      </el-form>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ readonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!readonly" type="primary" @click="submitHandle()">保存</el-button>
    </span>
  </el-dialog>
</template>

<script>
import {
  CURRENCY_OPTIONS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  INVOICE_STATUS_OPTIONS,
  BIZ_TYPE_OPTIONS,
  money,
  toDate
} from './const'

const defaultItem = () => ({
  id: 0,
  sourceOrderItemId: '',
  productId: '',
  productCode: '',
  productName: '',
  productSpec: '',
  unit: 'KG',
  batchNo: '',
  sourceContainerNo: '',
  warehouseName: '',
  quantity: 0,
  pieceCount: 0,
  actualPieceCount: 0,
  estimatedWeight: 0,
  actualInWeight: 0,
  actualOutWeight: 0,
  lossWeight: 0,
  unitPrice: 0,
  taxRate: 9,
  shelfLifeDays: 0,
  productionDate: null,
  expiryDate: null,
  remark: ''
})

const defaultExpense = () => ({
  id: 0,
  expenseType: '',
  expenseName: '',
  amount: 0,
  taxRate: 0,
  remark: ''
})

const defaultForm = (orderType, defaultBizType) => ({
  id: 0,
  orderNo: '',
  orderType,
  partnerId: '',
  partnerName: '',
  brandId: '',
  brandName: '',
  secondaryPartnerId: '',
  secondaryPartnerName: '',
  funderId: '',
  funderName: '',
  bizType: defaultBizType || (orderType === 'PURCHASE' ? 'PURCHASE_INBOUND' : 'NORMAL_OUTBOUND'),
  contractNo: '',
  relatedContractNo: '',
  containerNo: '',
  warehouseId: '',
  warehouseName: '',
  sourceOrderId: '',
  sourceOrderNo: '',
  storageStartDate: null,
  orderDate: new Date(),
  expectedDate: null,
  paymentDueDate: null,
  actualOutDate: null,
  currency: 'CNY',
  status: 0,
  paymentStatus: 0,
  invoiceStatus: 0,
  autoOutbound: defaultBizType === 'PRESALE' ? 1 : 0,
  storageFeeStartDays: 0,
  orderSource: 'MANUAL',
  remark: '',
  itemList: [defaultItem()],
  expenseList: []
})

export default {
  props: {
    orderType: {
      type: String,
      default: 'PURCHASE'
    },
    defaultBizType: {
      type: String,
      default: ''
    },
    lockBizType: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      visible: false,
      readonly: false,
      dataForm: defaultForm(this.orderType, this.defaultBizType),
      productList: [],
      partnerList: [],
      warehouseList: [],
      currencyOptions: CURRENCY_OPTIONS,
      orderStatusOptions: ORDER_STATUS_OPTIONS,
      paymentStatusOptions: PAYMENT_STATUS_OPTIONS,
      invoiceStatusOptions: INVOICE_STATUS_OPTIONS,
      bizTypeOptions: BIZ_TYPE_OPTIONS
    }
  },
  computed: {
    dialogTitle () {
      if (this.readonly) {
        return `查看${this.title}`
      }
      return `${this.dataForm.id ? '修改' : '新增'}${this.title}`
    },
    filteredPartnerList () {
      if (this.orderType === 'PURCHASE') {
        return this.partnerList.filter(item => this.hasAnyBusinessRole(item, ['BRAND', 'FUNDER', 'INTERNAL']))
      }
      return this.partnerList.filter(item => this.hasAnyBusinessRole(item, ['SECONDARY', 'INTERNAL']))
    },
    brandPartnerList () {
      return this.buildRolePartnerList('brandId', 'BRAND')
    },
    secondaryPartnerList () {
      return this.buildRolePartnerList('secondaryPartnerId', 'SECONDARY')
    },
    funderPartnerList () {
      return this.buildRolePartnerList('funderId', 'FUNDER')
    },
    currentWarehouseName () {
      return this.warehouseNameById(this.dataForm.warehouseId) || this.dataForm.warehouseName || ''
    },
    itemAmount () {
      return money(this.dataForm.itemList.reduce((sum, item) => sum + Number(this.rawLineAmount(item)), 0))
    },
    expenseAmount () {
      return money(this.dataForm.expenseList.reduce((sum, item) => sum + Number(item.amount || 0), 0))
    },
    taxAmount () {
      const itemTax = this.dataForm.itemList.reduce((sum, item) => sum + Number(this.rawLineTax(item)), 0)
      const expenseTax = this.dataForm.expenseList.reduce((sum, item) => sum + Number(this.rawExpenseTax(item)), 0)
      return money(itemTax + expenseTax)
    },
    totalAmount () {
      return money(Number(this.itemAmount) + Number(this.expenseAmount) + Number(this.taxAmount))
    }
  },
  methods: {
    init (id, readonly) {
      this.visible = true
      this.readonly = !!readonly
      this.dataForm = defaultForm(this.orderType, this.defaultBizType)
      this.dataForm.id = id || 0
      this.loadSelectList(() => {
        if (this.dataForm.id) {
          this.loadInfo()
        } else {
          this.syncItemWarehouses()
        }
      })
    },
    initFromDraft (draft, readonly) {
      this.visible = true
      this.readonly = !!readonly
      this.dataForm = defaultForm(this.orderType, this.defaultBizType)
      this.loadSelectList(() => {
        const form = Object.assign(defaultForm(this.orderType, this.defaultBizType), draft || {})
        form.orderDate = toDate(form.orderDate) || new Date()
        form.expectedDate = toDate(form.expectedDate)
        form.paymentDueDate = toDate(form.paymentDueDate)
        form.storageStartDate = toDate(form.storageStartDate)
        form.actualOutDate = toDate(form.actualOutDate)
        form.partnerId = this.resolvePartnerId(form.partnerName)
        form.brandId = this.resolvePartnerId(form.brandName)
        form.secondaryPartnerId = this.resolvePartnerId(form.secondaryPartnerName)
        form.funderId = this.resolvePartnerId(form.funderName)
        form.warehouseId = this.resolveWarehouseId(form.warehouseName)
        form.itemList = ((form.itemList || []).length ? form.itemList : [defaultItem()]).map(item => this.normalizeItemDraft(item))
        form.expenseList = (form.expenseList || []).map(item => this.normalizeExpenseDraft(item))
        this.dataForm = form
        this.syncItemWarehouses()
      })
    },
    loadSelectList (callback) {
      Promise.all([
        this.$http({
          url: this.$http.adornUrl('/erp/product/select'),
          method: 'get',
          params: this.$http.adornParams()
        }),
        this.$http({
          url: this.$http.adornUrl('/erp/partner/select'),
          method: 'get',
          params: this.$http.adornParams()
        }),
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/select'),
          method: 'get',
          params: this.$http.adornParams()
        })
      ]).then(([productRes, partnerRes, warehouseRes]) => {
        this.productList = ((productRes.data || {}).list) || []
        this.partnerList = ((partnerRes.data || {}).list) || []
        this.warehouseList = ((warehouseRes.data || {}).list) || []
        if (callback) {
          callback()
        }
      })
    },
    loadInfo () {
      this.$http({
        url: this.$http.adornUrl(`/erp/tradeorder/info/${this.dataForm.id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const form = Object.assign(defaultForm(this.orderType, this.defaultBizType), data.tradeOrder || {})
          form.orderDate = toDate(form.orderDate)
          form.expectedDate = toDate(form.expectedDate)
          form.paymentDueDate = toDate(form.paymentDueDate)
          form.storageStartDate = toDate(form.storageStartDate)
          form.actualOutDate = toDate(form.actualOutDate)
          form.itemList = ((form.itemList || []).length ? form.itemList : [defaultItem()]).map(item => this.normalizeItemDraft(item))
          form.expenseList = (form.expenseList || []).map(item => this.normalizeExpenseDraft(item))
          this.dataForm = form
          this.syncItemWarehouses()
        } else {
          this.$message.error(data.msg || '获取单据失败')
        }
      })
    },
    addItemRow () {
      const row = defaultItem()
      row.warehouseName = this.currentWarehouseName
      this.dataForm.itemList.push(row)
    },
    removeItemRow (index) {
      this.dataForm.itemList.splice(index, 1)
      if (!this.dataForm.itemList.length) {
        this.addItemRow()
      }
    },
    addExpenseRow () {
      this.dataForm.expenseList.push(defaultExpense())
    },
    removeExpenseRow (index) {
      this.dataForm.expenseList.splice(index, 1)
    },
    productChangeHandle (row) {
      const product = this.productList.find(item => item.id === row.productId)
      if (!product) {
        return
      }
      row.productCode = product.productCode
      row.productName = product.productName
      row.productSpec = product.productSpec
      row.unit = product.unit
      if (!row.taxRate && row.taxRate !== 0) {
        row.taxRate = product.defaultTaxRate
      }
      row.warehouseName = this.currentWarehouseName
    },
    hasBusinessRole (partner, roleCode) {
      const roleText = `${partner.businessRole || ''}`
      if (!roleText) {
        return false
      }
      return roleText.split(',').map(item => item.trim()).includes(roleCode)
    },
    hasAnyBusinessRole (partner, roleCodes) {
      return (roleCodes || []).some(roleCode => this.hasBusinessRole(partner, roleCode))
    },
    filterPartnersByRole (roleCode) {
      return this.partnerList.filter(item => this.hasBusinessRole(item, roleCode))
    },
    buildRolePartnerList (fieldName, roleCode) {
      const list = this.filterPartnersByRole(roleCode)
      const currentId = this.dataForm[fieldName]
      if (!currentId) {
        return list
      }
      const exists = list.some(item => item.id === currentId)
      if (exists) {
        return list
      }
      const currentPartner = this.partnerList.find(item => item.id === currentId)
      return currentPartner ? [currentPartner].concat(list) : list
    },
    normalizeItemDraft (item) {
      const row = Object.assign(defaultItem(), item || {})
      const product = this.resolveProduct(row)
      if (product) {
        row.productId = product.id
        row.productCode = product.productCode
        row.productName = product.productName
        row.productSpec = row.productSpec || product.productSpec
        row.unit = row.unit || product.unit
        if ((row.taxRate === '' || row.taxRate === null || row.taxRate === undefined) && product.defaultTaxRate !== undefined) {
          row.taxRate = product.defaultTaxRate
        }
      }
      row.quantity = Number(row.quantity || 0)
      row.pieceCount = Number(row.pieceCount || 0)
      row.actualPieceCount = Number(row.actualPieceCount || 0)
      row.estimatedWeight = Number(row.estimatedWeight || row.quantity || 0)
      row.actualInWeight = Number(row.actualInWeight || 0)
      row.actualOutWeight = Number(row.actualOutWeight || 0)
      row.lossWeight = Number(row.lossWeight || 0)
      row.unitPrice = Number(row.unitPrice || 0)
      row.taxRate = Number(row.taxRate || 0)
      row.productionDate = toDate(row.productionDate)
      row.expiryDate = toDate(row.expiryDate)
      row.warehouseName = row.warehouseName || this.currentWarehouseName
      return row
    },
    normalizeExpenseDraft (item) {
      const row = Object.assign(defaultExpense(), item || {})
      row.amount = Number(row.amount || 0)
      row.taxRate = Number(row.taxRate || 0)
      return row
    },
    resolvePartnerId (partnerName) {
      const partner = this.partnerList.find(item => item.partnerName === partnerName)
      return partner ? partner.id : ''
    },
    resolveProduct (row) {
      return this.productList.find(item => (
        (row.productId && item.id === row.productId) ||
        (row.productCode && item.productCode === row.productCode) ||
        (row.productName && item.productName === row.productName)
      ))
    },
    resolveWarehouseId (warehouseName) {
      const warehouse = this.warehouseList.find(item => item.warehouseName === warehouseName)
      return warehouse ? warehouse.id : ''
    },
    warehouseNameById (id) {
      const warehouse = this.warehouseList.find(item => item.id === id)
      return warehouse ? warehouse.warehouseName : ''
    },
    handleWarehouseChange () {
      this.syncItemWarehouses()
    },
    syncItemWarehouses () {
      const warehouseName = this.currentWarehouseName
      this.dataForm.warehouseName = warehouseName
      this.dataForm.itemList = (this.dataForm.itemList || []).map(item => Object.assign({}, item, {
        warehouseName
      }))
    },
    rawLineAmount (row) {
      return Number(row.quantity || 0) * Number(row.unitPrice || 0)
    },
    rawLineTax (row) {
      return this.rawLineAmount(row) * Number(row.taxRate || 0) / 100
    },
    rawExpenseTax (row) {
      return Number(row.amount || 0) * Number(row.taxRate || 0) / 100
    },
    lineAmount (row) {
      return money(this.rawLineAmount(row))
    },
    lineTax (row) {
      return money(this.rawLineTax(row))
    },
    lineTotal (row) {
      return money(this.rawLineAmount(row) + this.rawLineTax(row))
    },
    expenseTax (row) {
      return money(this.rawExpenseTax(row))
    },
    expenseTotal (row) {
      return money(Number(row.amount || 0) + this.rawExpenseTax(row))
    },
    submitHandle () {
      const validItems = this.dataForm.itemList.filter(item => item.productId && item.quantity && item.unitPrice >= 0)
      if (!validItems.length) {
        this.$message.error('请至少录入一条有效明细')
        return
      }
      const warehouseName = this.warehouseNameById(this.dataForm.warehouseId)
      const payload = Object.assign({}, this.dataForm, {
        orderType: this.orderType,
        itemList: validItems.map(item => Object.assign({}, item, {
          warehouseName
        })),
        expenseList: this.dataForm.expenseList.filter(item => item.expenseName || item.amount),
        partnerName: this.partnerNameById(this.dataForm.partnerId),
        brandName: this.partnerNameById(this.dataForm.brandId),
        secondaryPartnerName: this.partnerNameById(this.dataForm.secondaryPartnerId),
        funderName: this.partnerNameById(this.dataForm.funderId),
        warehouseName
      })
      this.$http({
        url: this.$http.adornUrl(`/erp/tradeorder/${!payload.id ? 'save' : 'update'}`),
        method: 'post',
        data: this.$http.adornData(payload)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message({
            message: '操作成功',
            type: 'success',
            duration: 1500,
            onClose: () => {
              this.visible = false
              this.$emit('refreshDataList')
            }
          })
        } else {
          this.$message.error(data.msg || '保存失败')
        }
      })
    },
    partnerNameById (id) {
      const partner = this.partnerList.find(item => item.id === id)
      return partner ? partner.partnerName : ''
    }
  }
}
</script>

<style scoped>
.trade-order-dialog .block-card {
  margin-top: 15px;
}

.trade-order-dialog .card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trade-order-dialog .summary-row {
  margin-top: 15px;
}

.trade-order-dialog .summary-item {
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 4px;
  font-weight: 500;
}

.trade-order-dialog .summary-item.total {
  color: #e6a23c;
}
</style>
