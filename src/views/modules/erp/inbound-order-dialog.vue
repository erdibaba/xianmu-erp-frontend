<template>
  <el-dialog
    :title="readonly ? '入库单详情' : '入库单维护'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="97%"
    top="4vh"
    custom-class="inbound-order-dialog-modal">
    <div class="inbound-order-dialog" v-loading="detailLoading">
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
            <el-form-item label="下单日期">
              <el-date-picker
                v-model="dataForm.orderDate"
                type="date"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width:100%;"
                disabled>
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
              <el-input v-model="dataForm.driverName" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="车牌">
              <el-input v-model="dataForm.truckNo" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="电话">
              <el-input v-model="dataForm.driverPhone" :disabled="readonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="身份证号">
              <el-input v-model="dataForm.idCardNo" :disabled="readonly"></el-input>
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
        </div>

        <div class="sub-title">SKU明细</div>
        <el-table :data="dataForm.itemList" border size="mini" class="item-table">
          <el-table-column type="index" label="序号" width="60" align="center" fixed="left"></el-table-column>

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
        <el-table-column label="下载" width="100" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="archiveDialogVisible = false">关闭</el-button>
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
      detailLoading: false,
      saveLoading: false,
      productList: [],
      warehouseList: [],
      dataForm: this.defaultForm(),
      dataRule: {
        contractNo: [{ required: true, message: '合同号不能为空', trigger: 'blur' }],
        warehouseId: [{ required: true, message: '请选择仓库', trigger: 'change' }]
      }
    }
  },
  methods: {
    defaultForm () {
      return {
        id: 0,
        presaleOrderId: 0,
        brandId: '',
        brandName: '',
        contractNo: '',
        customerName: '',
        warehouseId: '',
        warehouseName: '',
        orderDate: '',
        expectedArrivalDate: '',
        containerNo: '',
        driverName: '',
        truckNo: '',
        driverPhone: '',
        idCardNo: '',
        customerOrderNo: '',
        wmsOrderNo: '',
        rawText: '',
        remark: '',
        fileList: [],
        itemList: []
      }
    },
    init (presaleOrderId, readonly) {
      this.visible = true
      this.readonly = readonly
      this.archiveDialogVisible = false
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadProductList(), this.loadWarehouseList(), this.fetchDetail(presaleOrderId)]).finally(() => {
        this.detailLoading = false
      })
    },
    initFromRecognizedResult (presaleOrderId, result) {
      this.visible = true
      this.readonly = false
      this.archiveDialogVisible = false
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadProductList(), this.loadWarehouseList()]).then(() => {
        const draft = (result && result.inboundDraft) || {}
        this.dataForm = this.normalizeForm(Object.assign({}, draft, {
          presaleOrderId: presaleOrderId
        }))
      }).finally(() => {
        this.detailLoading = false
      })
    },
    fetchDetail (presaleOrderId) {
      return this.$http({
        url: this.$http.adornUrl(`/erp/inbound/info/${presaleOrderId}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm = this.normalizeForm(data.inboundOrder || {})
        } else {
          this.$message.error((data && data.msg) || '加载失败')
        }
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
    normalizeForm (form) {
      const source = form || {}
      const result = Object.assign(this.defaultForm(), source)
      result.fileList = (source.fileList || []).map(item => Object.assign({
        id: 0,
        filePath: '',
        fileName: ''
      }, item))
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
        temperatureZone: '',
        productionDate: '',
        expiryDate: '',
        shelfLifeDays: 0,
        specWeight: null,
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: [],
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
        const normalizedCode = this.extractProductCodeFromSku(row.skuCode) || String(row.productCode || '').replace(/[^0-9]/g, '')
        const product = row.productId
          ? this.productList.find(item => String(item.id) === String(row.productId))
          : this.productList.find(item => String(item.productCode) === normalizedCode)
        if (product) {
          this.applyProductToRow(row, product)
          return
        }
        row.productId = ''
        row.productCode = ''
        row.productSpec = ''
        row.unit = ''
        row.productName = row._recognizedProductName || row.productName
        row.productNameEn = row._recognizedProductNameEn || row.productNameEn
      })
    },
    extractProductCodeFromSku (skuCode) {
      const match = String(skuCode || '').match(/C?(\d{5})/i)
      return match ? match[1] : ''
    },
    skuChangeHandle (row) {
      const normalizedCode = this.extractProductCodeFromSku(row.skuCode)
      const product = this.productList.find(item => String(item.productCode) === normalizedCode)
      if (product) {
        this.applyProductToRow(row, product)
        return
      }
      row.productId = ''
      row.productCode = ''
      row.productSpec = ''
      row.unit = ''
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
        row.productCode = ''
        row.productSpec = ''
        row.unit = ''
        row.productName = row._recognizedProductName || row.productName
        row.productNameEn = row._recognizedProductNameEn || row.productNameEn
        return
      }
      const product = row._productOptions.find(item => String(item.id) === String(value)) ||
        this.productList.find(item => String(item.id) === String(value))
      if (!product) {
        row.productId = ''
        row.productCode = ''
        row.productSpec = ''
        row.unit = ''
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
    downloadFile (row) {
      if (!row.id) {
        this.$message.error('缺少归档文件ID')
        return
      }
      window.open(this.$http.adornUrl(`/erp/inbound/download/file/${row.id}`), '_blank')
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
  height: calc(100vh - 306px);
  max-height: calc(100vh - 306px);
  overflow: hidden;
}

.inbound-order-dialog /deep/ .el-form-item {
  margin-bottom: 14px;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  margin: 10px 0 8px;
}

.archive-action-wrap {
  margin: 2px 0 8px;
}

.item-table /deep/ .el-table__body-wrapper {
  height: 260px;
  max-height: 260px;
  overflow-y: auto;
}

.archive-dialog-table /deep/ .el-table__body-wrapper {
  height: 150px;
  max-height: 150px;
  overflow-y: auto;
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
</style>
