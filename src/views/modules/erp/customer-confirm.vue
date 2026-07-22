<template>
  <div class="mod-erp-customer-confirm">
    <el-alert
      title="客户订单确认以品牌方确认函小合同为主线。请先选择预售单，再上传客户订单确认函；装箱单、报关单、检疫证明均按确认函合同号归档。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" class="query-form">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="确认函合同号 / 柜号 / 预售合同号 / 采购方"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button
          v-if="isAuth('erp:tradeorder:list')"
          type="info"
          :loading="exportLoading"
          @click="exportHandle()">导出Excel</el-button>
        <el-button
          v-if="isAuth('erp:tradeorder:save')"
          type="success"
          @click="newConfirmHandle()">新建客户订单确认</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" class="main-table">
      <el-table-column prop="contractNo" label="客户订单确认合同号" min-width="180" fixed="left" show-overflow-tooltip></el-table-column>
      <el-table-column prop="sellerContractNo" label="关联预售合同号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="containerNo" label="柜号" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="remark" label="备注" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column prop="buyerPartnerName" label="采购方" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column prop="customerReference" label="预售单采购方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="预计到港" width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.expectedArrivalDate) }}</template>
      </el-table-column>
      <el-table-column label="总金额" width="130" align="right">
        <template slot-scope="scope">{{ money(scope.row.totalAmount) }}</template>
      </el-table-column>
      <el-table-column label="付款状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.paymentStatus === 1 ? 'success' : 'info'">
            {{ scope.row.paymentStatus === 1 ? '已付款' : '未付款' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="列表总重量(KG)" width="150" align="right">
        <template slot-scope="scope">{{ quantity(scope.row.totalQuantityKg) }}</template>
      </el-table-column>
      <el-table-column label="装箱单" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.packingUploaded ? 'success' : 'info'">
            {{ scope.row.packingUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="报关单" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.customsUploaded ? 'success' : 'info'">
            {{ scope.row.customsUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="检疫证明" width="100" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.quarantineUploaded ? 'success' : 'info'">
            {{ scope.row.quarantineUploaded ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="360" align="center">
        <template slot-scope="scope">
          <div class="action-wrap">
            <el-button type="text" size="small" @click="viewHandle(scope.row)">详情</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              @click="editHandle(scope.row)">修改</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:save')"
              type="text"
              size="small"
              @click="uploadConfirmHandle(scope.row)">重新上传确认函</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:save')"
              type="text"
              size="small"
              @click="uploadPackingHandle(scope.row)">{{ scope.row.packingUploaded ? '重新上传装箱单' : '上传装箱单' }}</el-button>
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
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              @click="arrivalNoticeHandle(scope.row)">到港通知</el-button>
            <el-button
              v-if="isAuth('erp:presale:confirm:delete')"
              type="text"
              size="small"
              class="danger-action"
              @click="deleteConfirmHandle(scope.row)">删除</el-button>
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

    <el-dialog
      title="新建客户订单确认"
      :close-on-click-modal="false"
      :visible.sync="createVisible"
      width="620px">
      <el-form label-width="120px">
        <el-form-item label="关联预售单" required>
          <el-select
            v-model="createForm.presaleOrderId"
            filterable
            remote
            clearable
            reserve-keyword
            :remote-method="remotePresaleSearch"
            :loading="presaleOptionLoading"
            placeholder="输入预售单号、预售合同号或采购方搜索"
            style="width: 100%;">
            <el-option
              v-for="item in presaleOptions"
              :key="item.id"
              :label="presaleOptionLabel(item)"
              :value="item.id">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="uploadNewConfirm()">上传客户订单确认函</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="发送到港通知"
      :close-on-click-modal="false"
      :visible.sync="arrivalNoticeVisible"
      width="640px">
      <el-form :model="arrivalNoticeForm" label-width="120px">
        <el-form-item label="确认函合同号">
          <el-input :value="arrivalNoticeForm.contractNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="集装箱号">
          <el-input :value="arrivalNoticeForm.containerNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="实际到港日期" required>
          <el-date-picker
            v-model="arrivalNoticeForm.actualArrivalDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择实际到港日期"
            style="width: 100%;">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="二批商" required>
          <el-select
            v-model="arrivalNoticeForm.partnerIds"
            multiple
            collapse-tags
            filterable
            clearable
            :loading="arrivalPartnerLoading"
            placeholder="默认选择关联期货单且已绑定企微客户群的二批商"
            style="width: 100%;">
            <el-option
              v-for="item in arrivalPartnerList"
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
            v-model="arrivalNoticeForm.content"
            type="textarea"
            :rows="6"
            placeholder="可留空，系统会根据确认函合同号、柜号、实际到港日期自动生成。">
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
        <el-button @click="arrivalNoticeVisible = false">取消</el-button>
        <el-button type="primary" :loading="arrivalNoticeLoading" @click="sendArrivalNotice()">创建群发任务</el-button>
      </span>
    </el-dialog>

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
      :confirm-id="currentConfirmId"
      :replace-mode="packingReplaceMode"
      @recognized="recognizedHandle"
      @uploaded="attachmentUploadedHandle">
    </presale-upload-dialog>

    <el-dialog
      title="确认函产品主数据确认"
      :close-on-click-modal="false"
      :visible.sync="confirmProductSyncVisible"
      width="1080px">
      <el-alert
        title="识别到确认函中有产品需要新增、补全名称或补全别名。请核对无误后再同步，避免 OCR 识别错误写入产品档案。"
        type="warning"
        show-icon
        :closable="false"
        class="confirm-product-sync-tip">
      </el-alert>
      <el-table :data="confirmProductSyncList" border size="mini" max-height="430">
        <el-table-column label="#" width="50" align="center">
          <template slot-scope="scope">{{ scope.$index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="actionText" label="处理方式" width="120" align="center"></el-table-column>
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
        <el-button
          type="primary"
          :loading="confirmProductSyncLoading"
          :disabled="confirmProductSyncLoading"
          @click="confirmProductSync()">确认同步并带入编辑</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import PresaleOrderDialog from './presale-order-dialog'
import PresaleUploadDialog from './presale-upload-dialog'

export default {
  components: {
    PresaleOrderDialog,
    PresaleUploadDialog
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
      exportLoading: false,
      dialogVisible: false,
      uploadVisible: false,
      uploadType: 'confirm',
      packingReplaceMode: false,
      currentOrderId: 0,
      currentConfirmId: 0,
      pendingRecognizedResult: null,
      confirmProductSyncVisible: false,
      confirmProductSyncLoading: false,
      confirmProductSyncList: [],
      productList: [],
      createVisible: false,
      createForm: {
        presaleOrderId: ''
      },
      presaleOptions: [],
      presaleOptionLoading: false,
      arrivalNoticeVisible: false,
      arrivalNoticeLoading: false,
      arrivalPartnerLoading: false,
      arrivalPartnerList: [],
      arrivalNoticeForm: {
        confirmId: 0,
        contractNo: '',
        containerNo: '',
        actualArrivalDate: '',
        partnerIds: [],
        content: ''
      }
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/presale/confirm-list'),
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
          this.$message.error((data && data.msg) || '查询失败')
        }
      }).finally(() => {
        this.dataListLoading = false
      })
    },
    exportHandle () {
      this.exportLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/presale/confirm-export'),
        method: 'get',
        params: this.$http.adornParams({
          keyword: this.queryForm.keyword
        }),
        responseType: 'blob'
      }).then(({ data }) => {
        this.downloadBlob(data, '客户订单确认.xlsx')
      }).catch(() => {
        this.$message.error('导出失败')
      }).finally(() => {
        this.exportLoading = false
      })
    },
    downloadBlob (blob, fileName) {
      const url = window.URL.createObjectURL(new Blob([blob], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }))
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
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
    newConfirmHandle () {
      this.createVisible = true
      this.createForm.presaleOrderId = ''
      this.remotePresaleSearch('')
    },
    remotePresaleSearch (keyword) {
      this.presaleOptionLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/presale/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 15,
          keyword: keyword || ''
        })
      }).then(({ data }) => {
        this.presaleOptions = (data && data.code === 0 && data.page && data.page.list) ? data.page.list : []
      }).finally(() => {
        this.presaleOptionLoading = false
      })
    },
    presaleOptionLabel (item) {
      const contractNo = item.sellerContractNo || item.orderNo || ''
      const customer = item.customerReference || ''
      return `${contractNo}${customer ? ' - ' + customer : ''}`
    },
    normalizeProductCode (code) {
      if (!code) return ''
      return String(code).replace(/[A-Za-z]+$/g, '')
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
    loadProductList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/product/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.productList = (data && data.list) || []
      })
    },
    hasProductAlias (product, code) {
      const target = String(code || '').trim().toUpperCase()
      if (!target) return false
      return String((product && product.aliasCodes) || '')
        .split(',')
        .some(alias => alias.trim().toUpperCase() === target)
    },
    findProductByConfirmCode (code) {
      const sourceCode = String(code || '').trim()
      if (!sourceCode) return null
      const normalizedCode = this.normalizeProductCode(sourceCode)
      return this.productList.find(item => String(item.productCode || '').trim() === sourceCode) ||
        this.productList.find(item => String(item.productCode || '').trim() === normalizedCode) ||
        this.productList.find(item => this.hasProductAlias(item, sourceCode)) ||
        null
    },
    buildActionText (product, missingMasterAlias, missingSourceAlias, missingName, missingNameEn, differentNameEn) {
      if (!product) return '新增'
      const actions = []
      if (missingMasterAlias || missingSourceAlias) actions.push('别名')
      if (missingName || missingNameEn || differentNameEn) actions.push('名称')
      return `补全${actions.join('/')}`
    },
    buildConfirmProductSyncRows (result) {
      const orderDraft = (result && result.orderDraft) || {}
      const itemList = orderDraft.itemList || []
      const brandName = orderDraft.brandName || ''
      const rowMap = {}
      itemList.forEach(item => {
        const sourceProductCode = String(item.sourceProductCode || item.productCode || '').trim()
        const productCode = this.normalizeProductCode(sourceProductCode)
        const rowKey = productCode + '|' + sourceProductCode.toUpperCase()
        if (!productCode || productCode.indexOf('/') !== -1 || rowMap[rowKey]) {
          return
        }
        const product = this.findProductByConfirmCode(sourceProductCode)
        const recognizedName = String(item.productName || '').trim()
        const recognizedNameEn = String(item.productNameEn || '').trim()
        if (!product) {
          rowMap[rowKey] = {
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
        const masterCode = String(product.productCode || productCode).trim()
        const currentName = String(product.productName || '').trim()
        const currentNameEn = String(product.productNameEn || '').trim()
        const missingMasterAlias = !this.hasProductAlias(product, masterCode)
        const missingSourceAlias = !this.hasProductAlias(product, sourceProductCode)
        const missingName = !currentName && !!recognizedName
        const missingNameEn = !currentNameEn && !!recognizedNameEn
        const differentNameEn = !!recognizedNameEn && !!currentNameEn && this.normalizeEnglishName(currentNameEn) !== this.normalizeEnglishName(recognizedNameEn)
        if (missingMasterAlias || missingSourceAlias || missingName || missingNameEn || differentNameEn) {
          rowMap[rowKey] = {
            actionText: this.buildActionText(product, missingMasterAlias, missingSourceAlias, missingName, missingNameEn, differentNameEn),
            originalProductCode: productCode,
            originalSourceProductCode: sourceProductCode,
            productCode: masterCode,
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
          if (!matched) return
          item.productCode = String(row.productCode || '').trim()
          item.sourceProductCode = String(row.sourceProductCode || row.productCode || '').trim()
          item.productName = String(row.recognizedName || '').trim()
          item.productNameEn = String(row.recognizedNameEn || '').trim()
        })
      })
      return result
    },
    buildConfirmProductSyncRequest (result) {
      const syncKeys = {}
      this.confirmProductSyncList.forEach(row => {
        if (row.originalProductCode) syncKeys[String(row.originalProductCode)] = true
        if (row.originalSourceProductCode) syncKeys[String(row.originalSourceProductCode)] = true
        if (row.productCode) syncKeys[String(row.productCode)] = true
        if (row.sourceProductCode) syncKeys[String(row.sourceProductCode)] = true
      })
      const request = JSON.parse(JSON.stringify(result || {}))
      const orderDraft = request.orderDraft || (request.orderDraft = {})
      orderDraft.itemList = (orderDraft.itemList || []).filter(item => {
        const sourceCode = String(item.sourceProductCode || item.productCode || '').trim()
        const productCode = this.normalizeProductCode(sourceCode)
        return !!(syncKeys[sourceCode] || syncKeys[productCode])
      })
      return request
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
    validateConfirmProductSyncRows () {
      const invalidRow = this.confirmProductSyncList.find(item => !String(item.productCode || '').trim())
      if (invalidRow) {
        this.$message.error('主产品代码不能为空')
        return false
      }
      return true
    },
    prepareConfirmProductSync (result) {
      return this.loadProductList().then(() => {
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
      const syncRequest = this.buildConfirmProductSyncRequest(editedResult)
      this.confirmProductSyncLoading = true
      this.syncConfirmProductMaster(syncRequest).then(() => {
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
    uploadNewConfirm () {
      if (!this.createForm.presaleOrderId) {
        this.$message.warning('请选择关联预售单')
        return
      }
      this.createVisible = false
      this.uploadType = 'confirm'
      this.currentOrderId = this.createForm.presaleOrderId
      this.currentConfirmId = 0
      this.openUploadDialog()
    },
    uploadConfirmHandle (row) {
      this.packingReplaceMode = false
      this.uploadType = 'confirm'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadPackingHandle (row) {
      this.packingReplaceMode = !!row.packingUploaded
      this.uploadType = 'packing'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadCustomsHandle (row) {
      this.packingReplaceMode = false
      this.uploadType = 'customs'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadQuarantineHandle (row) {
      this.packingReplaceMode = false
      this.uploadType = 'quarantine'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    openUploadDialog () {
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    openRecognizedResult (result) {
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.uploadType === 'packing') {
          this.$refs.dialog.initFromPackingResult(this.currentOrderId, result, this.currentConfirmId)
        } else {
          this.$refs.dialog.initFromConfirmResult(this.currentOrderId, result, this.currentConfirmId)
        }
      })
    },
    recognizedHandle (result) {
      if (this.uploadType === 'confirm') {
        this.prepareConfirmProductSync(result)
        return
      }
      this.openRecognizedResult(result)
    },
    attachmentUploadedHandle () {
      this.getDataList()
    },
    viewHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.presaleOrderId, true, 'confirm', row.id)
      })
    },
    editHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.presaleOrderId, false, 'confirm', row.id)
      })
    },
    deleteConfirmHandle (row) {
      const contractNo = row.contractNo || row.id
      this.$confirm(`删除后将同时清理该确认函的装箱单、报关单、检疫证明及归档原件。确定删除客户订单确认函[${contractNo}]吗？`, '删除确认', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const loading = this.$loading({ lock: true, text: '正在检查关联业务并删除确认函...' })
        this.$http({
          url: this.$http.adornUrl(`/erp/presale/confirm/delete/${row.id}`),
          method: 'post',
          data: this.$http.adornData({}, false)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('客户订单确认函已删除')
            if (this.dataList.length === 1 && this.pageIndex > 1) {
              this.pageIndex--
            }
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        }).catch(() => {
          this.$message.error('删除失败，请检查登录状态或后端服务')
        }).finally(() => {
          loading.close()
        })
      }).catch(() => {})
    },
    arrivalNoticeHandle (row) {
      this.arrivalNoticeForm = {
        confirmId: row.id,
        contractNo: row.contractNo || '',
        containerNo: row.containerNo || '',
        actualArrivalDate: this.formatDateOnly(row.expectedArrivalDate),
        partnerIds: [],
        content: ''
      }
      this.arrivalPartnerList = []
      this.arrivalNoticeVisible = true
      this.arrivalPartnerLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/wecom/arrival-notice/partners'),
        method: 'get',
        params: this.$http.adornParams({
          confirmId: row.id
        })
      }).then(({ data }) => {
        this.arrivalPartnerList = (data && data.code === 0 && data.list) ? data.list : []
        this.arrivalNoticeForm.partnerIds = this.arrivalPartnerList
          .filter(item => item.wecomChatId)
          .map(item => item.id)
        if (!this.arrivalPartnerList.length) {
          this.$message.warning('该确认函暂未找到关联期货销售单二批商')
        }
      }).finally(() => {
        this.arrivalPartnerLoading = false
      })
    },
    sendArrivalNotice () {
      if (!this.arrivalNoticeForm.actualArrivalDate) {
        this.$message.warning('请选择实际到港日期')
        return
      }
      if (!this.arrivalNoticeForm.partnerIds || !this.arrivalNoticeForm.partnerIds.length) {
        this.$message.warning('请选择至少一个二批商')
        return
      }
      this.arrivalNoticeLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/wecom/arrival-notice/send'),
        method: 'post',
        data: this.$http.adornData(this.arrivalNoticeForm)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success(`已创建${(data.list || []).length}个企业微信群发任务，请群主在企业微信里确认发送`)
          this.arrivalNoticeVisible = false
        } else {
          this.$message.error((data && data.msg) || '创建到港通知失败')
        }
      }).finally(() => {
        this.arrivalNoticeLoading = false
      })
    },
    formatDateOnly (value) {
      return value ? String(value).slice(0, 10) : ''
    },
    money (value) {
      const num = Number(value)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    },
    quantity (value) {
      const num = Number(value)
      return Number.isFinite(num) ? num.toFixed(2) : '0.00'
    }
  }
}
</script>

<style scoped>
.query-form {
  margin-top: 15px;
}

.main-table {
  margin-top: 15px;
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

.danger-action {
  color: #f56c6c;
}
</style>
