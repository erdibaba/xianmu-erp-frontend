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
          placeholder="预销售单号 / 合同号 / 采购方"
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
      <el-table-column prop="customerReference" label="采购方" min-width="200"></el-table-column>
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
      <el-table-column fixed="right" label="操作" width="300" align="center">
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
            v-if="isAuth('erp:tradeorder:update') && scope.row.confirmUploaded"
            type="text"
            size="small"
            @click="shipNoticeHandle(scope.row)">船期通知</el-button>
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

    <el-dialog
      title="确认函产品主数据确认"
      :close-on-click-modal="false"
      :visible.sync="confirmProductSyncVisible"
      width="1080px">
      <el-alert
        title="识别到确认函中有产品需要新增或补全主数据。请核对无误后再同步，避免 OCR 识别错误写入产品档案。"
        type="warning"
        show-icon
        :closable="false"
        class="confirm-product-sync-tip">
      </el-alert>
      <el-table :data="confirmProductSyncList" border size="mini" max-height="430">
        <el-table-column label="#" width="50" align="center">
          <template slot-scope="scope">{{ scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="actionText" label="处理方式" width="100" align="center"></el-table-column>
        <el-table-column label="主产品代码" width="140" align="center">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.productCode" size="mini"></el-input>
          </template>
        </el-table-column>
        <el-table-column label="确认函编码" width="150" align="center">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.sourceProductCode" size="mini"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="currentName" label="当前中文名" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column label="确认函中文名" min-width="190">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.recognizedName" size="mini"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="currentNameEn" label="当前英文名" min-width="210" show-overflow-tooltip></el-table-column>
        <el-table-column label="确认函英文名" min-width="260">
          <template slot-scope="scope">
            <el-input v-model.trim="scope.row.recognizedNameEn" size="mini"></el-input>
          </template>
        </el-table-column>
        <el-table-column prop="brandName" label="品牌方" min-width="170" show-overflow-tooltip></el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button :disabled="confirmProductSyncLoading" @click="skipConfirmProductSync()">暂不同步，带入编辑</el-button>
        <el-button
          type="primary"
          :loading="confirmProductSyncLoading"
          :disabled="confirmProductSyncLoading"
          @click="confirmProductSync()">确认同步并带入编辑</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="发送船期通知"
      :close-on-click-modal="false"
      :visible.sync="shipNoticeVisible"
      width="620px">
      <el-form :model="shipNoticeForm" label-width="110px">
        <el-form-item label="预销售单">
          <el-input :value="shipNoticeForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="二批商" required>
          <el-select
            v-model="shipNoticeForm.partnerIds"
            multiple
            collapse-tags
            filterable
            clearable
            placeholder="可输入搜索，支持选择多个已绑定企微客户群的二批商"
            style="width: 100%;">
            <el-option
              v-for="item in secondaryPartnerList"
              :key="item.id"
              :label="item.partnerName"
              :value="item.id"
              :disabled="!item.wecomChatId">
              <span>{{ item.partnerName }}</span>
              <span style="float: right; color: #909399; font-size: 12px;">{{ item.wecomChatName || '未绑定企微群' }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="通知内容">
          <el-input
            v-model="shipNoticeForm.content"
            type="textarea"
            :rows="6"
            placeholder="可留空，系统会根据确认函合同号、预计到港时间自动生成。">
          </el-input>
        </el-form-item>
        <el-alert
          title="企业微信会创建待发送任务，需要对应群主在企业微信里确认后才会真正发到客户群。"
          type="info"
          show-icon
          :closable="false">
        </el-alert>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="shipNoticeVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipNoticeLoading" @click="sendShipNotice()">创建群发任务</el-button>
      </span>
    </el-dialog>
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
      confirmProductSyncVisible: false,
      confirmProductSyncLoading: false,
      confirmProductSyncList: [],
      shipNoticeVisible: false,
      shipNoticeLoading: false,
      shipNoticeForm: {
        presaleOrderId: 0,
        orderNo: '',
        partnerIds: [],
        content: ''
      },
      productList: [],
      partnerList: []
    }
  },
  computed: {
    brandPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'BRAND'))
    },
    secondaryPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'SECONDARY'))
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
      }).then(({ data }) => {
        if (!data || data.code !== 0) {
          return Promise.reject(new Error((data && data.msg) || '产品主数据同步失败'))
        }
      })
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
    findProductByConfirmCode (code) {
      const sourceCode = String(code || '').trim()
      if (!sourceCode) return null
      const normalizedCode = this.normalizeProductCode(sourceCode)
      return this.productList.find(item => String(item.productCode || '').trim() === sourceCode) ||
        this.productList.find(item => String(item.productCode || '').trim() === normalizedCode) ||
        null
    },
    buildConfirmProductSyncRows (result) {
      const orderDraft = (result && result.orderDraft) || {}
      const itemList = orderDraft.itemList || []
      const brandName = orderDraft.brandName || ''
      const rowMap = {}
      itemList.forEach(item => {
        const sourceProductCode = String(item.sourceProductCode || item.productCode || '').trim()
        const productCode = this.normalizeProductCode(sourceProductCode)
        if (!productCode || productCode.indexOf('/') !== -1 || rowMap[productCode]) {
          return
        }
        const product = this.findProductByConfirmCode(sourceProductCode)
        const recognizedName = String(item.productName || '').trim()
        const recognizedNameEn = String(item.productNameEn || '').trim()
        if (!product) {
          rowMap[productCode] = {
            actionText: '新增',
            originalProductCode: productCode,
            originalSourceProductCode: sourceProductCode,
            productCode,
            sourceProductCode,
            currentName: '',
            currentNameEn: '',
            recognizedName,
            recognizedNameEn,
            brandName
          }
          return
        }
        const currentName = String(product.productName || '').trim()
        const currentNameEn = String(product.productNameEn || '').trim()
        const needName = !currentName && recognizedName
        const needNameEn = recognizedNameEn && currentNameEn !== recognizedNameEn
        const needBrand = !String(product.brand || '').trim() && brandName
        const needAlias = sourceProductCode && sourceProductCode !== String(product.productCode || '').trim()
        if (needName || needNameEn || needBrand || needAlias) {
          rowMap[productCode] = {
            actionText: '补全/更新',
            originalProductCode: productCode,
            originalSourceProductCode: sourceProductCode,
            productCode: product.productCode || productCode,
            sourceProductCode,
            currentName,
            currentNameEn,
            recognizedName,
            recognizedNameEn,
            brandName
          }
        }
      })
      return Object.keys(rowMap).map(key => rowMap[key])
    },
    applyConfirmProductSyncEdits (result) {
      const orderDraft = (result && result.orderDraft) || {}
      const itemList = orderDraft.itemList || []
      this.confirmProductSyncList.forEach(row => {
        const originalProductCode = String(row.originalProductCode || '').trim()
        const originalSourceProductCode = String(row.originalSourceProductCode || '').trim()
        itemList.forEach(item => {
          const itemSourceCode = String(item.sourceProductCode || item.productCode || '').trim()
          const itemProductCode = this.normalizeProductCode(itemSourceCode)
          const matched = itemProductCode === originalProductCode || itemSourceCode === originalSourceProductCode
          if (!matched) {
            return
          }
          item.productCode = String(row.productCode || '').trim()
          item.sourceProductCode = String(row.sourceProductCode || row.productCode || '').trim()
          item.productName = String(row.recognizedName || '').trim()
          item.productNameEn = String(row.recognizedNameEn || '').trim()
        })
      })
      return result
    },
    validateConfirmProductSyncRows () {
      const invalidRow = this.confirmProductSyncList.find(item => !String(item.productCode || '').trim())
      if (invalidRow) {
        this.$message.error('主产品代码不能为空')
        return false
      }
      return true
    },
    prepareConfirmProductSync (result) {
      return Promise.all([this.loadProductList(), this.loadPartnerList()]).then(() => {
        const rows = this.buildConfirmProductSyncRows(result)
        if (!rows.length) {
          this.openRecognizedResult(result)
          return
        }
        this.pendingRecognizedResult = result
        this.confirmProductSyncList = rows
        this.confirmProductSyncVisible = true
      })
    },
    skipConfirmProductSync () {
      const result = this.pendingRecognizedResult
      this.pendingRecognizedResult = null
      this.confirmProductSyncVisible = false
      if (result) {
        this.openRecognizedResult(this.applyConfirmProductSyncEdits(result))
      }
    },
    confirmProductSync () {
      if (this.confirmProductSyncLoading) {
        return
      }
      const result = this.pendingRecognizedResult
      if (!result) {
        this.confirmProductSyncVisible = false
        return
      }
      if (!this.validateConfirmProductSyncRows()) {
        return
      }
      const editedResult = this.applyConfirmProductSyncEdits(result)
      this.confirmProductSyncLoading = true
      this.syncConfirmProductMaster(editedResult).then(() => {
        this.$message.success('产品主数据同步成功')
        this.pendingRecognizedResult = null
        this.confirmProductSyncVisible = false
        return this.loadProductList()
      }).then(() => {
        this.openRecognizedResult(editedResult)
      }).catch(() => {
        this.$message.error('产品主数据同步失败，请核对后重试')
      }).finally(() => {
        this.confirmProductSyncLoading = false
      })
    },
    recognizedHandle (result) {
      if (this.uploadType === 'confirm') {
        this.prepareConfirmProductSync(result)
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
      this.openRecognizedResult(result)
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
    shipNoticeHandle (row) {
      this.loadPartnerList().then(() => {
        const defaultPartnerIds = this.secondaryPartnerList
          .filter(item => item.wecomChatId)
          .map(item => item.id)
        this.shipNoticeForm = {
          presaleOrderId: row.id,
          orderNo: row.orderNo || row.sellerContractNo || '',
          partnerIds: defaultPartnerIds,
          content: ''
        }
        this.shipNoticeVisible = true
      })
    },
    sendShipNotice () {
      if (!this.shipNoticeForm.partnerIds || !this.shipNoticeForm.partnerIds.length) {
        this.$message.warning('请选择至少一个二批商')
        return
      }
      this.shipNoticeLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/wecom/ship-notice/send'),
        method: 'post',
        data: this.$http.adornData(this.shipNoticeForm)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success(`已创建${(data.list || []).length}个企业微信群发任务，请群主在企业微信里确认发送`)
          this.shipNoticeVisible = false
        } else {
          this.$message.error((data && data.msg) || '创建船期通知失败')
        }
        this.shipNoticeLoading = false
      }).catch(() => {
        this.shipNoticeLoading = false
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

.confirm-product-sync-tip {
  margin-bottom: 12px;
}
</style>
