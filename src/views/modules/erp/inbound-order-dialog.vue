<template>
  <el-dialog
    :title="readonly ? '入库单详情' : '入库单维护'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="97%"
    top="4vh"
    custom-class="inbound-order-dialog-modal">
    <div ref="dialogBody" class="inbound-order-dialog" v-loading="detailLoading">
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="dataRule"
        label-width="110px"
        @keyup.enter.native="dataFormSubmit()">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="合同号" prop="contractNo">
              <el-input v-model="dataForm.contractNo" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户">
              <el-input v-model="dataForm.customerName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="品牌方">
              <el-input v-model="dataForm.brandName" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="入库日期" prop="actualInboundDate">
              <el-date-picker
                v-model="dataForm.actualInboundDate"
                type="date"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                style="width:100%;"
                :disabled="readonly">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预计到港">
              <el-date-picker
                v-model="dataForm.expectedArrivalDate"
                type="date"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width:100%;"
                disabled>
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId">
              <el-select
                v-model="dataForm.warehouseId"
                :disabled="readonly"
                filterable
                clearable
                placeholder="请选择仓库"
                style="width:100%;"
                @change="warehouseChangeHandle">
                <el-option
                  v-for="item in warehouseList"
                  :key="item.id"
                  :label="item.warehouseName"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="集装箱号">
              <el-input v-model="dataForm.containerNo" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="司机姓名">
              <el-select
                v-if="!readonly"
                v-model="dataForm.driverId"
                filterable
                clearable
                remote
                reserve-keyword
                :remote-method="searchDrivers"
                :loading="driverLoading"
                placeholder="输入司机姓名/车牌号/手机号/身份证号搜索"
                style="width:100%;"
                @visible-change="driverSelectVisibleChange"
                @change="driverSelectChange">
                <el-option
                  v-for="item in driverOptions"
                  :key="item.id"
                  :label="`${item.driverName} / ${item.plateNo} / ${item.mobile}`"
                  :value="item.id">
                  <div class="driver-option-main">{{ item.driverName }} / {{ item.plateNo }} / {{ item.mobile }}</div>
                  <div class="driver-option-sub">身份证：{{ item.idCardNo || '-' }}</div>
                </el-option>
              </el-select>
              <el-input v-else v-model="dataForm.driverName" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号">
              <el-input v-model="dataForm.idCardNo" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col v-if="false" :span="8">
            <el-form-item label="电话">
              <el-input v-model="dataForm.driverPhone" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="客户订单号">
              <el-input v-model="dataForm.customerOrderNo" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="WMS订单号">
              <el-input v-model="dataForm.wmsOrderNo" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item label="备注">
              <el-input v-model="dataForm.remark" type="textarea" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="archive-action-wrap">
          <el-button size="mini" @click="archiveDialogVisible = true">
            查看归档原件（{{ (dataForm.fileList || []).length }}）
          </el-button>
          <el-button size="mini" @click="expenseDialogVisible = true">
            查看关联支出费用（{{ (dataForm.expenseList || []).length }}）
          </el-button>
        </div>

        <div class="sku-title-row">
          <div class="sub-title">SKU明细</div>
          <el-button v-if="!readonly" size="mini" type="primary" @click="addItemRow()">新增明细</el-button>
        </div>
        <el-table ref="skuTable" :data="dataForm.itemList" border size="mini" :height="skuTableHeight" :fit="false" class="item-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column v-if="!readonly" label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="removeItemRow(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
          <el-table-column label="报损" width="90" align="center">
            <template slot-scope="scope">
              <el-button
                v-if="!readonly"
                type="text"
                size="small"
                @click="openDamageDialog(scope.row)">
                入库报损
              </el-button>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column label="SKU" min-width="180">
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.skuCode"
                size="mini"
                :disabled="readonly"
                @change="skuChangeHandle(scope.row)">
              </el-input>
            </template>
          </el-table-column>

          <el-table-column label="产品编码" min-width="240">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.productId"
                filterable
                clearable
                remote
                reserve-keyword
                size="mini"
                :disabled="readonly"
                :loading="scope.row._productLoading"
                placeholder="请输入产品编码/中文/英文搜索"
                style="width: 100%;"
                @visible-change="(visible) => productSelectVisibleChange(scope.row, visible)"
                :remote-method="(keyword) => remoteSearchProducts(scope.row, keyword)"
                @change="(value) => productSelectChange(scope.row, value)">
                <el-option
                  v-for="item in scope.row._productOptions"
                  :key="item.id"
                  :label="item.productCode"
                  :value="item.id">
                  <div class="product-option-code">{{ item.productCode }}</div>
                  <div class="product-option-name">{{ item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                </el-option>
              </el-select>
              <div v-if="!scope.row.productId && scope.row.productCode" class="recognized-product-code">
                识别编码：{{ scope.row.productCode }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="productName" label="中文名称" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productSpec" label="规格" width="90"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>

          <el-table-column label="规格重量" width="110">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.specWeight"
                :disabled="readonly"
                :controls="false"
                :precision="4"
                :min="0"
                size="mini"
                style="width:100%;">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column label="预期数" width="90">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.expectedQty"
                :disabled="readonly"
                :controls="false"
                :precision="0"
                :min="0"
                size="mini"
                style="width:100%;">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column label="实收数" width="90">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.actualQty"
                :disabled="readonly"
                :controls="false"
                :precision="0"
                :min="0"
                size="mini"
                style="width:100%;">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column prop="packingBoxes" label="装箱单箱数" width="100"></el-table-column>
          <el-table-column label="报损重量(KG)" width="120" align="right">
            <template slot-scope="scope">{{ formatDamageWeight(scope.row.damageWeightKg) }}</template>
          </el-table-column>

          <el-table-column label="温区" width="90">
            <template slot-scope="scope">
              <el-input v-model="scope.row.temperatureZone" size="mini" :disabled="readonly"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="生产日期" width="130">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.productionDate"
                type="date"
                value-format="yyyy-MM-dd HH:mm:ss"
                size="mini"
                :disabled="readonly"
                style="width:100%;">
              </el-date-picker>
            </template>
          </el-table-column>

          <el-table-column label="过期日期" width="130">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.expiryDate"
                type="date"
                value-format="yyyy-MM-dd HH:mm:ss"
                size="mini"
                :disabled="readonly"
                style="width:100%;">
              </el-date-picker>
            </template>
          </el-table-column>

          <el-table-column label="保质期天数" width="100">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.shelfLifeDays"
                :disabled="readonly"
                :controls="false"
                :precision="0"
                :min="0"
                size="mini"
                style="width:100%;">
              </el-input-number>
            </template>
          </el-table-column>
        </el-table>
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button v-if="!readonly" type="primary" :loading="saveLoading" @click="dataFormSubmit()">保存</el-button>
    </span>

    <el-dialog
      title="归档原件"
      append-to-body
      :visible.sync="archiveDialogVisible"
      width="60%"
      top="10vh">
      <el-table :data="dataForm.fileList" border size="mini" class="archive-dialog-table">
        <el-table-column prop="fileName" label="文件名称" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="filePath" label="归档路径" min-width="280" show-overflow-tooltip></el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
            <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="archiveDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="关联支出费用"
      append-to-body
      :visible.sync="expenseDialogVisible"
      width="72%"
      top="10vh">
      <el-table :data="dataForm.expenseList || []" border size="mini" height="360" class="expense-dialog-table">
        <el-table-column prop="expenseName" label="费用名称" width="120"></el-table-column>
        <el-table-column prop="warehouseName" label="仓库" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="temperatureZone" label="温区" width="80" align="center"></el-table-column>
        <el-table-column label="业务日期" width="110" align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.businessStartDate) }}</template>
        </el-table-column>
        <el-table-column label="重量(吨)" width="100" align="right">
          <template slot-scope="scope">{{ formatNumber(scope.row.weightTon, 3) }}</template>
        </el-table-column>
        <el-table-column label="费率" width="90" align="right">
          <template slot-scope="scope">{{ formatNumber(scope.row.rate, 2) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template slot-scope="scope">{{ formatMoney(scope.row.totalAmount) }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="expenseDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="入库报损"
      append-to-body
      :visible.sync="damageDialogVisible"
      width="520px"
      top="12vh">
      <el-form
        ref="damageForm"
        :model="damageForm"
        :rules="damageRule"
        label-width="110px">
        <el-form-item label="产品编码">
          <el-input v-model="damageForm.productCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="中文名称">
          <el-input v-model="damageForm.productName" disabled></el-input>
        </el-form-item>
        <el-form-item label="英文名称">
          <el-input v-model="damageForm.productNameEn" disabled></el-input>
        </el-form-item>
        <el-form-item label="报损重量" prop="damageWeightKg">
          <el-input-number
            v-model="damageForm.damageWeightKg"
            :controls="false"
            :precision="2"
            :min="0"
            size="small"
            style="width: 180px;">
          </el-input-number>
          <span class="damage-unit">KG</span>
        </el-form-item>
        <el-form-item label="报损原因" prop="damageReason">
          <el-input
            v-model="damageForm.damageReason"
            type="textarea"
            :rows="4"
            maxlength="200"
            show-word-limit
            placeholder="请输入报损原因，最多200字">
          </el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="damageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="damageSaving" @click="saveDamage()">保存</el-button>
      </span>
    </el-dialog>
  </el-dialog>
</template>

<script>
export default {
  data () {
    return {
      visible: false,
      readonly: false,
      archiveDialogVisible: false,
      expenseDialogVisible: false,
      damageDialogVisible: false,
      detailLoading: false,
      saveLoading: false,
      damageSaving: false,
      skuTableHeight: 300,
      packingBoxMap: {},
      productList: [],
      warehouseList: [],
      driverOptions: [],
      driverLoading: false,
      currentDamageRow: null,
      damageForm: {
        itemId: '',
        productCode: '',
        productName: '',
        productNameEn: '',
        damageWeightKg: null,
        damageReason: ''
      },
      dataForm: this.defaultForm(),
      dataRule: {
        contractNo: [{ required: true, message: '合同号不能为空', trigger: 'blur' }],
        actualInboundDate: [{ required: true, message: '请选择入库日期', trigger: 'change' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }]
      },
      damageRule: {
        damageWeightKg: [{ required: true, message: '请输入报损重量', trigger: 'change' }],
        damageReason: [{ max: 200, message: '报损原因最多200字', trigger: 'blur' }]
      }
    }
  },
  mounted () {
    this.updateSkuTableHeight()
    window.addEventListener('resize', this.updateSkuTableHeight)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.updateSkuTableHeight)
  },
  methods: {
    defaultForm () {
      return {
        id: 0,
        presaleOrderId: 0,
        confirmId: 0,
        brandId: '',
        brandName: '',
        contractNo: '',
        customerName: '',
        warehouseId: '',
        warehouseName: '',
        orderDate: '',
        actualInboundDate: '',
        expectedArrivalDate: '',
        containerNo: '',
        driverId: '',
        driverName: '',
        truckNo: '',
        driverPhone: '',
        idCardNo: '',
        customerOrderNo: '',
        wmsOrderNo: '',
        rawText: '',
        remark: '',
        fileList: [],
        expenseList: [],
        itemList: []
      }
    },
    init (presaleOrderId, confirmId, readonly) {
      if (typeof confirmId === 'boolean') {
        readonly = confirmId
        confirmId = 0
      }
      this.visible = true
      this.readonly = readonly
      this.$nextTick(this.updateSkuTableHeight)
      this.archiveDialogVisible = false
      this.expenseDialogVisible = false
      this.damageDialogVisible = false
      this.driverOptions = []
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadProductList(), this.loadWarehouseList(), this.loadPackingBoxMap(presaleOrderId, confirmId)]).then(() => {
        return this.fetchDetail(presaleOrderId, confirmId)
      }).finally(() => {
        this.detailLoading = false
        this.$nextTick(this.updateSkuTableHeight)
      })
    },
    initFromRecognizedResult (presaleOrderId, confirmId, result) {
      if (result === undefined) {
        result = confirmId
        confirmId = 0
      }
      this.visible = true
      this.readonly = false
      this.$nextTick(this.updateSkuTableHeight)
      this.archiveDialogVisible = false
      this.expenseDialogVisible = false
      this.damageDialogVisible = false
      this.driverOptions = []
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadProductList(), this.loadWarehouseList(), this.loadPackingBoxMap(presaleOrderId, confirmId)]).then(() => {
        const draft = (result && result.inboundDraft) || {}
        this.dataForm = this.normalizeForm(Object.assign({}, draft, {
          presaleOrderId: presaleOrderId,
          confirmId: confirmId || draft.confirmId || 0
        }))
        return this.resolveRecognizedDriver()
      }).finally(() => {
        this.detailLoading = false
        this.$nextTick(this.updateSkuTableHeight)
      })
    },
    fetchDetail (presaleOrderId, confirmId) {
      return this.$http({
        url: this.$http.adornUrl(`/erp/inbound/info/${presaleOrderId}`),
        method: 'get',
        params: this.$http.adornParams({
          confirmId: confirmId || 0
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm = this.normalizeForm(data.inboundOrder || {})
        } else {
          this.$message.error((data && data.msg) || '加载失败')
        }
      })
    },
    updateSkuTableHeight () {
      this.$nextTick(() => {
        const viewportHeight = window.innerHeight || 900
        const fallbackHeight = Math.max(320, Math.min(460, viewportHeight - 510))
        const dialogBody = this.$refs.dialogBody
        const skuTable = this.$refs.skuTable && this.$refs.skuTable.$el
        if (!dialogBody || !skuTable) {
          this.skuTableHeight = fallbackHeight
          return
        }
        const bodyRect = dialogBody.getBoundingClientRect()
        const tableRect = skuTable.getBoundingClientRect()
        const availableHeight = Math.floor(bodyRect.bottom - tableRect.top - 12)
        this.skuTableHeight = availableHeight > 0
          ? Math.max(300, Math.min(460, availableHeight))
          : fallbackHeight
        this.$nextTick(() => {
          if (this.$refs.skuTable) {
            this.$refs.skuTable.doLayout()
          }
        })
      })
    },
    loadProductList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/product/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.productList = (data && data.list) || []
      })
    },
    loadWarehouseList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/warehouse/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.warehouseList = (data && data.list) || []
      })
    },
    loadPackingBoxMap (presaleOrderId, confirmId) {
      return this.$http({
        url: this.$http.adornUrl(`/erp/inbound/packing-boxes/${presaleOrderId}`),
        method: 'get',
        params: this.$http.adornParams({
          confirmId: confirmId || 0
        })
      }).then(({ data }) => {
        this.packingBoxMap = (data && data.packingBoxMap) || {}
      }).catch(() => {
        this.packingBoxMap = {}
      })
    },
    driverSelectVisibleChange (visible) {
      if (visible && !this.driverOptions.length) {
        this.searchDrivers(this.dataForm.driverName || this.dataForm.truckNo || this.dataForm.driverPhone || this.dataForm.idCardNo || '')
      }
    },
    searchDrivers (keyword) {
      this.driverLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/inbound/driver/select'),
        method: 'get',
        params: this.$http.adornParams({
          keyword: keyword || ''
        })
      }).then(({ data }) => {
        this.driverOptions = data && data.code === 0 ? (data.page.list || []) : []
      }).catch(() => {
        this.driverOptions = []
      }).finally(() => {
        this.driverLoading = false
      })
    },
    driverSelectChange (value) {
      if (!value) {
        this.dataForm.driverId = ''
        return
      }
      const driver = this.driverOptions.find(item => String(item.id) === String(value))
      if (driver) {
        this.applyDriver(driver)
      }
    },
    ensureDriverOption (driver) {
      if (!driver || !driver.id) {
        return
      }
      const exists = this.driverOptions.some(item => String(item.id) === String(driver.id))
      if (!exists) {
        this.driverOptions = [driver].concat(this.driverOptions)
      }
    },
    applyDriver (driver) {
      this.ensureDriverOption(driver)
      this.dataForm.driverId = driver.id
      this.dataForm.driverName = driver.driverName || ''
      this.dataForm.truckNo = driver.plateNo || ''
      this.dataForm.driverPhone = driver.mobile || ''
      this.dataForm.idCardNo = driver.idCardNo || this.dataForm.idCardNo || ''
    },
    normalizePlateNo (value) {
      return String(value || '').trim().toUpperCase()
    },
    normalizeText (value) {
      return String(value || '').trim()
    },
    findExactDriver (drivers) {
      const name = this.normalizeText(this.dataForm.driverName)
      const plate = this.normalizePlateNo(this.dataForm.truckNo)
      const mobile = this.normalizeText(this.dataForm.driverPhone)
      const idCardNo = this.normalizeText(this.dataForm.idCardNo)
      return (drivers || []).find(driver => {
        const driverName = this.normalizeText(driver.driverName)
        const driverPlate = this.normalizePlateNo(driver.plateNo)
        const driverMobile = this.normalizeText(driver.mobile)
        const driverIdCardNo = this.normalizeText(driver.idCardNo)
        return (plate && driverPlate === plate) ||
          (mobile && driverMobile === mobile) ||
          (idCardNo && driverIdCardNo === idCardNo) ||
          (name && driverName === name && (plate || mobile || idCardNo))
      })
    },
    resolveRecognizedDriver () {
      const hasRecognizedDriver = this.dataForm.driverName || this.dataForm.truckNo || this.dataForm.driverPhone || this.dataForm.idCardNo
      if (!hasRecognizedDriver) {
        return Promise.resolve()
      }
      const keyword = this.dataForm.truckNo || this.dataForm.driverPhone || this.dataForm.idCardNo || this.dataForm.driverName || ''
      return this.$http({
        url: this.$http.adornUrl('/erp/inbound/driver/select'),
        method: 'get',
        params: this.$http.adornParams({
          keyword
        })
      }).then(({ data }) => {
        const drivers = data && data.code === 0 ? (data.page.list || []) : []
        this.driverOptions = drivers
        const matched = this.findExactDriver(drivers)
        if (matched) {
          this.applyDriver(matched)
          return
        }
        return this.confirmCreateRecognizedDriver()
      }).catch(() => {
        return this.confirmCreateRecognizedDriver()
      })
    },
    confirmCreateRecognizedDriver () {
      const driver = {
        driverName: this.normalizeText(this.dataForm.driverName),
        plateNo: this.normalizePlateNo(this.dataForm.truckNo),
        mobile: this.normalizeText(this.dataForm.driverPhone),
        idCardNo: this.normalizeText(this.dataForm.idCardNo),
        status: 1
      }
      if (!driver.driverName && !driver.plateNo && !driver.mobile && !driver.idCardNo) {
        return Promise.resolve()
      }
      return this.completeRecognizedDriverForCreate(driver).then(completedDriver => {
        if (!completedDriver) {
          return
        }
        return this.$confirm(
          `识别到司机 ${completedDriver.driverName} / ${completedDriver.plateNo} / ${completedDriver.mobile}，司机档案中不存在，是否新增？`,
          '新增司机信息',
          {
            confirmButtonText: '确认新增',
            cancelButtonText: '暂不新增',
            type: 'warning'
          }
        ).then(() => {
          this.detailLoading = true
          return this.$http({
            url: this.$http.adornUrl('/erp/inbound/driver/save'),
            method: 'post',
            data: this.$http.adornData(completedDriver)
          }).then(({ data }) => {
            if (data && data.code === 0) {
              const savedDriver = data.driver || completedDriver
              this.applyDriver(savedDriver)
              this.$message.success('司机信息已新增并带入')
            } else {
              this.$message.error((data && data.msg) || '新增司机失败')
            }
          }).finally(() => {
            this.detailLoading = false
          })
        })
      }).catch(() => {
        // 用户取消补全或暂不新增时，仅保留OCR识别字段供人工核对。
      })
    },
    completeRecognizedDriverForCreate (driver) {
      const work = Object.assign({}, driver)
      const promptField = (field, title, message, normalizer) => {
        if (work[field]) {
          return Promise.resolve()
        }
        return this.$prompt(message, title, {
          confirmButtonText: '继续',
          cancelButtonText: '暂不新增',
          inputValue: '',
          inputValidator: value => !!this.normalizeText(value) || `${message}不能为空`,
          inputErrorMessage: `${message}不能为空`
        }).then(({ value }) => {
          work[field] = normalizer ? normalizer(value) : this.normalizeText(value)
        })
      }
      return promptField('driverName', '补全司机姓名', '请输入司机姓名')
        .then(() => promptField('plateNo', '补全车牌号', '请输入车牌号', this.normalizePlateNo))
        .then(() => promptField('mobile', '补全手机号', '请输入手机号'))
        .then(() => work)
    },
    normalizeForm (form) {
      const source = form || {}
      const result = Object.assign(this.defaultForm(), source)
      result.fileList = (source.fileList || []).map(item => Object.assign({
        id: 0,
        filePath: '',
        fileName: ''
      }, item))
      result.expenseList = source.expenseList || []
      if (result.driverId && result.driverName) {
        this.ensureDriverOption({
          id: result.driverId,
          driverName: result.driverName,
          plateNo: result.truckNo,
          mobile: result.driverPhone,
          idCardNo: result.idCardNo
        })
      }
      result.itemList = (source.itemList || []).map(item => Object.assign({
        id: 0,
        productId: '',
        productCode: '',
        skuCode: '',
        productName: '',
        productNameEn: '',
        productSpec: '',
        unit: '',
        expectedQty: 0,
        actualQty: 0,
        packingBoxes: 0,
        damageWeightKg: null,
        damageReason: '',
        temperatureZone: '',
        productionDate: '',
        expiryDate: '',
        shelfLifeDays: 0,
        specWeight: null,
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: [],
        _recognizedProductCode: item.productCode || this.extractProductCodeFromSku(item.skuCode),
        _recognizedProductName: item.productName || '',
        _recognizedProductNameEn: item.productNameEn || ''
      }, item))
      this.syncProductRows(result.itemList)
      return result
    },
    warehouseChangeHandle (value) {
      const warehouse = this.warehouseList.find(item => String(item.id) === String(value))
      this.dataForm.warehouseName = warehouse ? warehouse.warehouseName : ''
    },
    syncProductRows (itemList) {
      itemList.forEach(row => {
        const normalizedCode = this.extractProductCodeFromSku(row.skuCode) || this.normalizeProductCode(row.productCode)
        row._recognizedProductCode = row._recognizedProductCode || normalizedCode
        const product = row.productId
          ? this.productList.find(item => String(item.id) === String(row.productId))
          : this.productList.find(item => String(item.productCode) === normalizedCode)
        if (product) {
          this.applyProductToRow(row, product)
          return
        }
        row.productId = ''
        row.productCode = row._recognizedProductCode || normalizedCode || ''
        row.productSpec = ''
        row.unit = ''
        row.packingBoxes = 0
        row.productName = row._recognizedProductName || row.productName
        row.productNameEn = row._recognizedProductNameEn || row.productNameEn
      })
    },
    defaultItemRow () {
      return {
        id: 0,
        productId: '',
        productCode: '',
        skuCode: '',
        productName: '',
        productNameEn: '',
        productSpec: '',
        unit: '',
        expectedQty: null,
        actualQty: null,
        packingBoxes: 0,
        damageWeightKg: null,
        damageReason: '',
        temperatureZone: '',
        productionDate: '',
        expiryDate: '',
        shelfLifeDays: null,
        specWeight: null,
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: [],
        _recognizedProductCode: '',
        _recognizedProductName: '',
        _recognizedProductNameEn: ''
      }
    },
    addItemRow () {
      if (this.readonly) {
        return
      }
      if (!this.dataForm.itemList) {
        this.$set(this.dataForm, 'itemList', [])
      }
      this.dataForm.itemList.push(this.defaultItemRow())
    },
    removeItemRow (index) {
      if (this.readonly || !this.dataForm.itemList) {
        return
      }
      this.dataForm.itemList.splice(index, 1)
    },
    extractProductCodeFromSku (skuCode) {
      const text = String(skuCode || '').toUpperCase()
      const fMatch = text.match(/F(\d{5})/)
      if (fMatch) {
        return fMatch[1]
      }
      const match = text.match(/C?(\d{5})/)
      return match ? match[1] : ''
    },
    normalizeProductCode (code) {
      const text = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
      const fMatch = text.match(/^F(\d{5})/)
      if (fMatch) {
        return fMatch[1]
      }
      return text.replace(/[^0-9]/g, '')
    },
    skuChangeHandle (row) {
      const normalizedCode = this.extractProductCodeFromSku(row.skuCode)
      row._recognizedProductCode = normalizedCode || row._recognizedProductCode || ''
      const product = this.productList.find(item => String(item.productCode) === normalizedCode)
      if (product) {
        this.applyProductToRow(row, product)
        return
      }
      row.productId = ''
      row.productCode = row._recognizedProductCode || normalizedCode || ''
      row.productSpec = ''
      row.unit = ''
      row.packingBoxes = 0
      row.productName = row._recognizedProductName || row.productName
      row.productNameEn = row._recognizedProductNameEn || row.productNameEn
    },
    applyProductToRow (row, product) {
      row.productId = product.id
      row.productCode = product.productCode
      row.productName = product.productName || row._recognizedProductName || ''
      row.productNameEn = product.productNameEn || row._recognizedProductNameEn || ''
      row.productSpec = product.productSpec
      row.unit = product.unit
      row.packingBoxes = this.packingBoxMap[String(product.productCode)] || 0
      if (!row._productOptions.find(item => String(item.id) === String(product.id))) {
        row._productOptions = [product].concat(row._productOptions)
      }
    },
    productSelectVisibleChange (row, visible) {
      if (!visible || this.readonly) {
        return
      }
      if (row._productOptions.length > 0) {
        return
      }
      row._productKeyword = row.productCode || this.extractProductCodeFromSku(row.skuCode) || ''
      this.fetchRowProductOptions(row)
    },
    remoteSearchProducts (row, keyword) {
      row._productKeyword = keyword
      this.fetchRowProductOptions(row)
    },
    fetchRowProductOptions (row) {
      row._productLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/product/selectPage'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: row._productPageSize,
          keyword: row._productKeyword
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          row._productOptions = (data.page.list || []).map(item => Object.assign({}, item))
        } else {
          row._productOptions = []
          this.$message.error((data && data.msg) || '获取产品列表失败')
        }
        row._productLoading = false
      }).catch(() => {
        row._productOptions = []
        row._productLoading = false
      })
    },
    productSelectChange (row, value) {
      if (!value) {
        row.productId = ''
        row.productCode = row._recognizedProductCode || ''
        row.productSpec = ''
        row.unit = ''
        row.packingBoxes = 0
        row.productName = row._recognizedProductName || row.productName
        row.productNameEn = row._recognizedProductNameEn || row.productNameEn
        return
      }
      const product = row._productOptions.find(item => String(item.id) === String(value)) ||
        this.productList.find(item => String(item.id) === String(value))
      if (!product) {
        row.productId = ''
        row.productCode = row._recognizedProductCode || ''
        row.productSpec = ''
        row.unit = ''
        row.packingBoxes = 0
        row.productName = row._recognizedProductName || row.productName
        row.productNameEn = row._recognizedProductNameEn || row.productNameEn
        return
      }
      this.applyProductToRow(row, product)
    },
    toNumber (value) {
      if (value === '' || value === null || value === undefined) {
        return 0
      }
      const parsed = Number(value)
      return isNaN(parsed) ? 0 : parsed
    },
    isEmptyNumber (value) {
      return value === '' || value === null || value === undefined
    },
    formatDamageWeight (value) {
      if (value === '' || value === null || value === undefined) {
        return '-'
      }
      const parsed = Number(value)
      return isNaN(parsed) ? '-' : parsed.toFixed(2)
    },
    formatDate (value) {
      if (!value) return '-'
      return String(value).substring(0, 10)
    },
    formatNumber (value, precision) {
      const parsed = Number(value || 0)
      return isNaN(parsed) ? '-' : parsed.toFixed(precision)
    },
    formatMoney (value) {
      const parsed = Number(value || 0)
      if (isNaN(parsed)) return '-'
      return parsed.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    openDamageDialog (row) {
      if (this.readonly) {
        this.$message.error('详情页仅支持查看，请在修改页进行入库报损')
        return
      }
      this.currentDamageRow = row
      this.damageForm = {
        itemId: row.id || '',
        productCode: row.productCode || '',
        productName: row.productName || '',
        productNameEn: row.productNameEn || '',
        damageWeightKg: row.damageWeightKg === '' || row.damageWeightKg === null || row.damageWeightKg === undefined ? null : Number(row.damageWeightKg),
        damageReason: row.damageReason || ''
      }
      this.damageDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.damageForm) {
          this.$refs.damageForm.clearValidate()
        }
      })
    },
    saveDamage () {
      if (this.readonly) {
        this.$message.error('详情页仅支持查看，请在修改页进行入库报损')
        return
      }
      this.$refs.damageForm.validate((valid) => {
        if (!valid) return false
        if (!this.currentDamageRow) return false
        const damageWeight = this.damageForm.damageWeightKg === '' || this.damageForm.damageWeightKg === null || this.damageForm.damageWeightKg === undefined
          ? null
          : Number(this.damageForm.damageWeightKg).toFixed(2)
        const applyLocal = () => {
          this.currentDamageRow.damageWeightKg = damageWeight
          this.currentDamageRow.damageReason = this.damageForm.damageReason || ''
          this.damageDialogVisible = false
          this.$message.success('报损信息已保存')
        }
        if (!this.damageForm.itemId) {
          applyLocal()
          return
        }
        this.damageSaving = true
        this.$http({
          url: this.$http.adornUrl('/erp/inbound/item/damage'),
          method: 'post',
          data: this.$http.adornData({
            itemId: this.damageForm.itemId,
            damageWeightKg: damageWeight,
            damageReason: this.damageForm.damageReason || ''
          })
        }).then(({ data }) => {
          if (data && data.code === 0) {
            applyLocal()
          } else {
            this.$message.error((data && data.msg) || '报损保存失败')
          }
          this.damageSaving = false
        }).catch(() => {
          this.damageSaving = false
        })
      })
    },
    downloadFile (row) {
      if (!row.id) {
        this.$message.error('缺少归档文件ID')
        return
      }
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/inbound/download/file/${row.id}?token=${encodeURIComponent(token)}`), '_blank')
    },
    previewFile (row) {
      if (!row.id) {
        this.$message.error('缺少归档文件ID')
        return
      }
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/inbound/download/file/${row.id}?preview=1&token=${encodeURIComponent(token)}`), '_blank')
    },
    dataFormSubmit () {
      if (this.readonly) {
        return
      }
      this.$refs.dataForm.validate((valid) => {
        if (!valid) {
          return false
        }
        const itemList = this.dataForm.itemList || []
        const invalidProductRow = itemList.find(item => !item.productId || !String(item.productCode || '').trim())
        if (invalidProductRow) {
          this.$message.error(`第${itemList.indexOf(invalidProductRow) + 1}行产品编码未选择`)
          return false
        }
        const invalidSkuRow = itemList.find(item => !String(item.skuCode || '').trim())
        if (invalidSkuRow) {
          this.$message.error(`第${itemList.indexOf(invalidSkuRow) + 1}行SKU不能为空`)
          return false
        }
        const invalidExpectedQtyRow = itemList.find(item => this.isEmptyNumber(item.expectedQty))
        if (invalidExpectedQtyRow) {
          this.$message.error(`第${itemList.indexOf(invalidExpectedQtyRow) + 1}行预期数不能为空`)
          return false
        }
        const invalidActualQtyRow = itemList.find(item => this.isEmptyNumber(item.actualQty))
        if (invalidActualQtyRow) {
          this.$message.error(`第${itemList.indexOf(invalidActualQtyRow) + 1}行实收数不能为空`)
          return false
        }
        const packingValidateMessage = this.validatePackingBoxMatch(itemList)
        if (packingValidateMessage) {
          this.$message.error(packingValidateMessage)
          return false
        }
        this.saveLoading = true
        this.$http({
          url: this.$http.adornUrl(`/erp/inbound/${this.dataForm.id ? 'update' : 'save'}`),
          method: 'post',
          data: this.$http.adornData(this.buildSubmitData())
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('保存成功')
            this.visible = false
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '保存失败')
          }
          this.saveLoading = false
        }).catch(() => {
          this.saveLoading = false
        })
      })
    },
    buildSubmitData () {
      return Object.assign({}, this.dataForm, {
        warehouseName: this.dataForm.warehouseName,
        fileList: (this.dataForm.fileList || []).map(item => ({
          id: item.id,
          filePath: item.filePath,
          fileName: item.fileName
        })),
        itemList: (this.dataForm.itemList || []).map(item => ({
          id: item.id,
          productId: item.productId,
          productCode: item.productCode,
          skuCode: item.skuCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          productSpec: item.productSpec,
          unit: item.unit,
          expectedQty: item.expectedQty,
          actualQty: item.actualQty,
          packingBoxes: item.packingBoxes,
          damageWeightKg: item.damageWeightKg,
          damageReason: item.damageReason,
          temperatureZone: item.temperatureZone,
          productionDate: item.productionDate,
          expiryDate: item.expiryDate,
          shelfLifeDays: item.shelfLifeDays,
          specWeight: item.specWeight
        }))
      })
    },
    validatePackingBoxMatch (itemList) {
      const actualQtyByCode = {}
      const packingBoxesByCode = {}
      ;(itemList || []).forEach(item => {
        const productCode = String(item.productCode || '').trim()
        if (!productCode) {
          return
        }
        actualQtyByCode[productCode] = this.toNumber(actualQtyByCode[productCode]) + this.toNumber(item.actualQty)
        packingBoxesByCode[productCode] = this.toNumber(item.packingBoxes)
      })
      const mismatchCode = Object.keys(packingBoxesByCode).find(productCode =>
        this.toNumber(actualQtyByCode[productCode]) !== this.toNumber(packingBoxesByCode[productCode]))
      if (mismatchCode) {
        return `产品${mismatchCode}的实收数与装箱单箱数不一致，请核对`
      }
      const totalActualQty = Object.keys(actualQtyByCode).reduce((sum, productCode) => sum + this.toNumber(actualQtyByCode[productCode]), 0)
      const totalPackingBoxes = Object.keys(packingBoxesByCode).reduce((sum, productCode) => sum + this.toNumber(packingBoxesByCode[productCode]), 0)
      if (totalActualQty !== totalPackingBoxes) {
        return '入库单总实收数与装箱单总箱数不一致，请核对'
      }
      return ''
    }
  }
}
</script>

<style scoped>
.inbound-order-dialog {
  height: calc(100vh - 246px);
  max-height: calc(100vh - 246px);
  overflow: hidden;
  padding: 0 4px 0 0;
}

.inbound-order-dialog /deep/ .el-form-item {
  margin-bottom: 14px;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0 8px;
}

.sku-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0 8px;
}

.sku-title-row .sub-title {
  margin: 0;
}

.archive-action-wrap {
  margin: 2px 0 8px;
}

.item-table /deep/ .el-table__body-wrapper {
  overflow: auto !important;
}

.item-table {
  margin-bottom: 8px;
}

.item-table /deep/ .el-table__fixed-right {
  height: auto !important;
}

.archive-dialog-table /deep/ .el-table__body-wrapper {
  height: 150px;
  max-height: 150px;
  overflow-y: auto;
}

.damage-unit {
  margin-left: 8px;
  color: #606266;
}

.product-option-code {
  color: #303133;
  font-weight: 600;
  line-height: 18px;
}

.product-option-name {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.recognized-product-code {
  margin-top: 4px;
  color: #E6A23C;
  font-size: 12px;
  line-height: 16px;
}

.driver-option-main {
  color: #303133;
  font-weight: 600;
  line-height: 18px;
}

.driver-option-sub {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
</style>
