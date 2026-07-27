<template>
  <div class="mod-erp-inbound-manage">
    <el-alert
      title="入库管理以预销售单为来源。只有客户订单确认函、装箱单、报关单、检疫证明全部上传完成后，才会进入这里等待上传入库单。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" style="margin-top: 15px;">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="合同号 / 客户 / 品牌方"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" style="margin-top: 15px;">
      <el-table-column prop="contractNo" label="合同号" min-width="170"></el-table-column>
      <el-table-column prop="customerName" label="客户" min-width="180"></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="180"></el-table-column>
      <el-table-column label="入库日期" width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.actualInboundDate || scope.row.orderDate) }}</template>
      </el-table-column>
      <el-table-column label="预计到港" width="120" align="center">
        <template slot-scope="scope">{{ formatDateOnly(scope.row.expectedArrivalDate) }}</template>
      </el-table-column>
      <el-table-column label="入库单上传状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.uploadStatus ? 'success' : 'info'">
            {{ scope.row.uploadStatus ? '已上传' : '未上传' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="230" align="center">
        <template slot-scope="scope">
          <div class="action-wrap">
            <el-button type="text" size="small" @click="viewHandle(scope.row)">详情</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              @click="editHandle(scope.row)">修改</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:save') && !scope.row.uploadStatus"
              type="text"
              size="small"
              @click="uploadHandle(scope.row)">上传入库单</el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:update') && scope.row.uploadStatus"
              type="text"
              size="small"
              @click="replaceUploadHandle(scope.row)">重新上传入库单</el-button>
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

    <inbound-order-dialog
      v-if="dialogVisible"
      ref="dialog"
      @refreshDataList="getDataList">
    </inbound-order-dialog>

    <inbound-upload-dialog
      v-if="uploadVisible"
      ref="uploadDialog"
      :presale-order-id="currentPresaleOrderId"
      :confirm-id="currentConfirmId"
      :replace-mode="currentReplaceMode"
      @recognized="recognizedHandle">
    </inbound-upload-dialog>
  </div>
</template>

<script>
import InboundOrderDialog from './inbound-order-dialog'
import InboundUploadDialog from './inbound-upload-dialog'

export default {
  components: {
    InboundOrderDialog,
    InboundUploadDialog
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
      currentPresaleOrderId: 0,
      currentConfirmId: 0,
      currentInboundOrderId: 0,
      currentReplaceMode: false
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/inbound/list'),
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
    uploadHandle (row) {
      this.currentPresaleOrderId = row.presaleOrderId
      this.currentConfirmId = row.confirmId || 0
      this.currentInboundOrderId = 0
      this.currentReplaceMode = false
      this.uploadVisible = true
      this.$nextTick(() => {
        this.$refs.uploadDialog.init()
      })
    },
    replaceUploadHandle (row) {
      this.$confirm(
        '重新上传后，新归档附件和SKU明细将在最终保存时覆盖原数据；取消编辑不会影响原入库单。是否继续？',
        '重新上传入库单',
        {
          confirmButtonText: '继续上传',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        this.currentPresaleOrderId = row.presaleOrderId
        this.currentConfirmId = row.confirmId || 0
        this.currentInboundOrderId = row.id || 0
        this.currentReplaceMode = true
        this.uploadVisible = true
        this.$nextTick(() => {
          this.$refs.uploadDialog.init()
        })
      }).catch(() => {})
    },
    recognizedHandle (result) {
      const recognizedResult = JSON.parse(JSON.stringify(result || {}))
      this.uploadVisible = false
      this.dialogVisible = false
      this.$nextTick(() => {
        this.dialogVisible = true
        this.$nextTick(() => {
          if (this.$refs.dialog) {
            this.$refs.dialog.initFromRecognizedResult(
              this.currentPresaleOrderId,
              this.currentConfirmId,
              recognizedResult,
              this.currentInboundOrderId
            )
          }
        })
      })
    },
    viewHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.presaleOrderId, row.confirmId || 0, true)
      })
    },
    editHandle (row) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(row.presaleOrderId, row.confirmId || 0, false)
      })
    }
  }
}
</script>

<style scoped>
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
