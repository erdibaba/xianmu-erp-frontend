<template>
  <div class="mod-erp-presale-order">
    <el-alert
      title="预销售单流程：先上传预售销售单并保存预估版，再对已保存的预销售单上传客户订单确认函，后续执行以客户订单确认函为准。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" style="margin-top: 15px;">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="预销售单号 / 合同号 / Customer Reference"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button
          v-if="isAuth('erp:tradeorder:save')"
          type="success"
          @click="uploadEstimateHandle()">上传预售销售单</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" style="margin-top: 15px;">
      <el-table-column prop="orderNo" label="预销售单号" min-width="150" align="center"></el-table-column>
      <el-table-column prop="sellerContractNo" label="合同号" min-width="160"></el-table-column>
      <el-table-column prop="customerReference" label="Customer Reference" min-width="200"></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="180"></el-table-column>
      <el-table-column prop="currency" label="币种" width="90" align="center"></el-table-column>
      <el-table-column label="下单日期" min-width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.orderDate) }}</template>
      </el-table-column>
      <el-table-column label="预计到港" min-width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.expectedDate) }}</template>
      </el-table-column>
      <el-table-column label="确认函状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.confirmUploaded ? 'success' : 'info'">
            {{ scope.row.confirmUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="装箱单状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.packingUploaded ? 'success' : 'info'">
            {{ scope.row.packingUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报关单状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.customsUploaded ? 'success' : 'info'">
            {{ scope.row.customsUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="检疫证明状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.quarantineUploaded ? 'success' : 'info'">
            {{ scope.row.quarantineUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="260" align="center">
        <template slot-scope="scope">
          <div class="action-wrap">
          <el-button type="text" size="small" @click="viewHandle(scope.row.id)">详情</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:update')"
            type="text"
            size="small"
            @click="editHandle(scope.row.id)">修改</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:save') && !scope.row.confirmUploaded"
            type="text"
            size="small"
            @click="uploadConfirmHandle(scope.row)">上传客户订单确认函</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:save') && !scope.row.packingUploaded"
            type="text"
            size="small"
            @click="uploadPackingHandle(scope.row)">上传装箱单</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:save') && !scope.row.customsUploaded"
            type="text"
            size="small"
            @click="uploadCustomsHandle(scope.row)">上传报关单</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:save') && !scope.row.quarantineUploaded"
            type="text"
            size="small"
            @click="uploadQuarantineHandle(scope.row)">上传检疫证明</el-button>
          <el-button
            v-if="isAuth('erp:tradeorder:delete')"
            type="text"
            size="small"
            @click="deleteHandle(scope.row.id)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle"
      :current-page="pageIndex"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper">
    </el-pagination>

    <presale-order-dialog
      v-if="dialogVisible"
      ref="dialog"
      @refreshDataList="getDataList">
    </presale-order-dialog>

    <presale-upload-dialog
      v-if="uploadVisible"
      ref="uploadDialog"
      :upload-type="uploadType"
      :order-id="currentOrderId"
      @recognized="recognizedHandle"
      @uploaded="attachmentUploadedHandle">
    </presale-upload-dialog>

    <presale-product-batch-dialog
      v-if="batchProductVisible"
      ref="batchProductDialog"
      :brand-options="brandPartnerList"
      @saved="batchProductSavedHandle">
    </presale-product-batch-dialog>
  </div>
</template>

<script>
import PresaleOrderDialog from './presale-order-dialog'
import PresaleUploadDialog from './presale-upload-dialog'
import PresaleProductBatchDialog from './presale-product-batch-dialog'

export default {
  components: {
    PresaleOrderDialog,
    PresaleUploadDialog,
    PresaleProductBatchDialog
  },
  data () {
    return {
      queryForm: {
        keyword: ''
      },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dialogVisible: false,
      uploadVisible: false,
      batchProductVisible: false,
      uploadType: 'estimate',
      currentOrderId: 0,
      pendingRecognizedResult: null,
      productList: [],
      partnerList: []
    }
  },
  computed: {
    brandPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'BRAND'))
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    hasBusinessRole (item, role) {
      const businessRole = (item && item.businessRole) || ''
      return businessRole.split(',').map(value => value.trim()).indexOf(role) !== -1
    },
    normalizeProductCode (code) {
      if (!code) return ''
      return String(code).replace(/[A-Za-z]+$/g, '')
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
    loadPartnerList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.partnerList = (data && data.list) || []
      })
    },
    buildMissingProducts (result) {
      const itemList = (((result || {}).orderDraft || {}).itemList) || []
      const sourceBrandName = (((result || {}).orderDraft || {}).brandName) || ''
      const defaultBrandName = /silver\s*fern\s*farms/i.test(String(sourceBrandName)) ? '银之蕨食品（上海）有限公司' : sourceBrandName
      const existsMap = {}
      this.productList.forEach(item => {
        existsMap[String(item.productCode)] = true
      })
      const missingMap = {}
      itemList.forEach(item => {
        const normalizedCode = this.normalizeProductCode(item.productCode || item.sourceProductCode || item.itemNo || '')
        if (!normalizedCode || existsMap[String(normalizedCode)] || missingMap[String(normalizedCode)]) {
          return
        }
        missingMap[String(normalizedCode)] = {
          productCode: normalizedCode,
          productName: '',
          productNameEn: '',
          brand: defaultBrandName,
          status: 1
        }
      })
      return Object.keys(missingMap).map(key => missingMap[key])
    },
    openRecognizedResult (result) {
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.uploadType === 'confirm') {
          this.$refs.dialog.initFromConfirmResult(this.currentOrderId, result)
        } else if (this.uploadType === 'packing') {
          this.$refs.dialog.initFromPackingResult(this.currentOrderId, result)
        } else {
          this.$refs.dialog.initFromEstimateResult(result)
        }
      })
    },
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/presale/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.dataList = []
          this.totalPage = 0
          this.$message.error((data && data.msg) || '??????')
        }
        this.dataListLoading = false
      }).catch(() => {
        this.dataListLoading = false
      })
    },
    formatDateOnly (value) {
      if (!value) {
        return ''
      }
      return String(value).slice(0, 10)
    },
    sizeChangeHandle (val) {
      this.pageSize = val
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (val) {
      this.pageIndex = val
      this.getDataList()
    },
    uploadEstimateHandle () {
      this.uploadType = 'estimate'
      this.currentOrderId = 0
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    uploadConfirmHandle (row) {
      this.uploadType = 'confirm'
      this.currentOrderId = row.id
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    uploadPackingHandle (row) {
      this.uploadType = 'packing'
      this.currentOrderId = row.id
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    uploadCustomsHandle (row) {
      this.uploadType = 'customs'
      this.currentOrderId = row.id
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    uploadQuarantineHandle (row) {
      this.uploadType = 'quarantine'
      this.currentOrderId = row.id
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    syncConfirmProductMaster (result) {
      const orderDraft = (result && result.orderDraft) || {}
      return this.$http({
        url: this.$http.adornUrl('/erp/presale/sync-confirm-products'),
        method: 'post',
        data: this.$http.adornData(orderDraft)
      }).catch(() => {})
    },
    syncPackingProductMaster (result) {
      const packingDraft = (result && result.packingDraft) || {}
      return this.$http({
        url: this.$http.adornUrl('/erp/presale/sync-packing-products'),
        method: 'post',
        data: this.$http.adornData(packingDraft)
      })
    },
    normalizeEnglishName (value) {
      if (!value) return ''
      return String(value)
        .replace(/^(SYB[-\s]+)/i, '')
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase()
    },
    findProductByEnglishName (name) {
      const normalized = this.normalizeEnglishName(name)
      if (!normalized) return null
      return this.productList.find(item => this.normalizeEnglishName(item.productNameEn) === normalized) || null
    },
    recognizedHandle (result) {
      if (this.uploadType === 'confirm') {
        this.syncConfirmProductMaster(result).then(() => {
          this.openRecognizedResult(result)
        })
        return
      }
      if (this.uploadType === 'packing') {
        Promise.all([this.loadProductList(), this.loadPartnerList()]).then(() => {
          this.syncPackingProductMaster(result).then(() => {
            this.openRecognizedResult(result)
          }).catch(() => {
            this.openRecognizedResult(result)
          })
        })
        return
      }
      Promise.all([this.loadProductList(), this.loadPartnerList()]).then(() => {
        const missingProducts = this.buildMissingProducts(result)
        if (missingProducts.length) {
          this.pendingRecognizedResult = result
          this.batchProductVisible = true
          this.$nextTick(() => {
            this.$refs.batchProductDialog.init(missingProducts)
            this.$message({
              message: '识别到部分产品未建立主数据，请先确认新增后再继续录入预销售单。',
              type: 'error',
              customClass: 'presale-top-message'
            })
          })
          return
        }
        this.openRecognizedResult(result)
      })
    },
    batchProductSavedHandle () {
      const result = this.pendingRecognizedResult
      this.pendingRecognizedResult = null
      if (!result) {
        return
      }
      this.openRecognizedResult(result)
    },
    attachmentUploadedHandle () {
      this.getDataList()
    },
    viewHandle (id) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(id, true, 'estimate')
      })
    },
    editHandle (id) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(id, false, 'estimate')
      })
    },
    deleteHandle (id) {
      this.$confirm(`确定对[id=${id}]进行删除操作?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl('/erp/presale/delete'),
          method: 'post',
          data: this.$http.adornData([id], false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        })
      })
    }
  }
}
</script>

<style>
.presale-top-message {
  z-index: 5000 !important;
}

.action-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  line-height: 1.6;
}

.action-wrap .el-button {
  margin-left: 0;
  margin-right: 10px;
}
</style>
