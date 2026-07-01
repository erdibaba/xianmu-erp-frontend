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
          v-if="isAuth('erp:tradeorder:save')"
          type="success"
          @click="newConfirmHandle()">新建客户订单确认</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" class="main-table">
      <el-table-column prop="contractNo" label="客户订单确认合同号" min-width="180" fixed="left" show-overflow-tooltip></el-table-column>
      <el-table-column prop="sellerContractNo" label="关联预售合同号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="containerNo" label="柜号" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="buyerPartnerName" label="采购方" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column prop="customerReference" label="预售单采购方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="预计到港" width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.expectedArrivalDate) }}</template>
      </el-table-column>
      <el-table-column label="总金额" width="130" align="right">
        <template slot-scope="scope">{{ money(scope.row.totalAmount) }}</template>
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
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              @click="arrivalNoticeHandle(scope.row)">到港通知</el-button>
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
      @recognized="recognizedHandle"
      @uploaded="attachmentUploadedHandle">
    </presale-upload-dialog>
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
      dialogVisible: false,
      uploadVisible: false,
      uploadType: 'confirm',
      currentOrderId: 0,
      currentConfirmId: 0,
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
      this.uploadType = 'confirm'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadPackingHandle (row) {
      this.uploadType = 'packing'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadCustomsHandle (row) {
      this.uploadType = 'customs'
      this.currentOrderId = row.presaleOrderId
      this.currentConfirmId = row.id
      this.openUploadDialog()
    },
    uploadQuarantineHandle (row) {
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
    recognizedHandle (result) {
      this.dialogVisible = true
      this.$nextTick(() => {
        if (this.uploadType === 'packing') {
          this.$refs.dialog.initFromPackingResult(this.currentOrderId, result, this.currentConfirmId)
        } else {
          this.$refs.dialog.initFromConfirmResult(this.currentOrderId, result, this.currentConfirmId)
        }
      })
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
</style>
