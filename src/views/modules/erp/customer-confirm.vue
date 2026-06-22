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
      <el-table-column fixed="right" label="操作" width="300" align="center">
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
              v-if="isAuth('erp:tradeorder:save')"
              type="text"
              size="small"
              @click="uploadQuarantineHandle(scope.row)">上传检疫证明</el-button>
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
      presaleOptionLoading: false
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
