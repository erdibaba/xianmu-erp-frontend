<template>
  <div class="mod-erp-sale-order">
    <el-alert
      title="销售单分为期货单和现货单。期货单按箱数关联预销售单明细；现货单必须先有库存，系统会按过期日期最早、入库时间最早、柜号顺序自动扣减库存。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" style="margin-top: 15px;">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          placeholder="销售单号 / 合同号 / 二批商 / 仓库"
          clearable
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.saleType" clearable placeholder="销售类型" style="width: 140px;">
          <el-option
            v-for="item in saleTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.status" clearable placeholder="流程状态" style="width: 180px;">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:tradeorder:save')" type="success" @click="addHandle()">新增销售单</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" style="margin-top: 15px;">
      <el-table-column prop="orderNo" label="销售单号" min-width="150"></el-table-column>
      <el-table-column label="类型" width="100" align="center">
        <template slot-scope="scope">{{ getSaleTypeLabel(scope.row.saleType) }}</template>
      </el-table-column>
      <el-table-column prop="secondaryPartnerName" label="二批商" min-width="180"></el-table-column>
      <el-table-column prop="warehouseName" label="仓库" min-width="160"></el-table-column>
      <el-table-column prop="contractNo" label="合同号" min-width="160"></el-table-column>
      <el-table-column label="关联预销售单" min-width="170">
        <template slot-scope="scope">{{ scope.row.sourcePresaleOrderNo || '-' }}</template>
      </el-table-column>
      <el-table-column label="预售关联状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.saleType === 'FUTURES'" size="small" :type="Number(scope.row.presaleLinkConfirmed || 0) === 1 ? 'success' : 'warning'">
            {{ Number(scope.row.presaleLinkConfirmed || 0) === 1 ? '已确认' : '未确认' }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="流程状态" min-width="180" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="合同页面" min-width="180">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.contractUrl"
            type="text"
            size="small"
            @click="openContract(scope.row.contractUrl)">
            打开合同页面
          </el-button>
          <el-button
            v-if="scope.row.contractUrl"
            type="text"
            size="small"
            @click="copyContractUrl(scope.row.contractUrl)">
            复制链接
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="上传通知" width="130" align="center">
        <template slot-scope="scope">
          <el-tooltip
            v-if="Number(scope.row.uploadNoticeStatus || 0) === 9 && scope.row.uploadNoticeErrorMessage"
            :content="scope.row.uploadNoticeErrorMessage"
            placement="top">
            <el-tag size="small" type="danger">{{ scope.row.uploadNoticeStatusText || '发送失败' }}</el-tag>
          </el-tooltip>
          <el-tag v-else size="small" :type="getUploadNoticeType(scope.row.uploadNoticeStatus)">
            {{ scope.row.uploadNoticeStatusText || '未发送' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="220" align="center">
        <template slot-scope="scope">
          <div class="action-wrap">
            <el-button
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              @click="editHandle(scope.row.id)">
              编辑
            </el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:update') && scope.row.saleType === 'FUTURES'"
              type="text"
              size="small"
              @click="openPresaleLinkDialog(scope.row)">
              预售关联
            </el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:update')"
              type="text"
              size="small"
              :loading="noticeSendingId === scope.row.id"
              @click="sendUploadNotice(scope.row)">
              {{ Number(scope.row.uploadNoticeStatus || 0) === 1 || Number(scope.row.uploadNoticeStatus || 0) === 2 ? '重新发送链接' : '发送上传链接' }}
            </el-button>
            <el-button
              v-if="isAuth('erp:tradeorder:delete') && !hasUploadedAttachment(scope.row)"
              type="text"
              size="small"
              @click="deleteHandle(scope.row.id)">
              删除
            </el-button>
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

    <sale-order-dialog
      v-if="dialogVisible"
      ref="dialog"
      @refreshDataList="getDataList">
    </sale-order-dialog>

    <el-dialog
      title="期货单关联预销售单"
      :visible.sync="presaleLinkVisible"
      :close-on-click-modal="false"
      width="560px">
      <el-form label-width="120px">
        <el-form-item label="销售单号">
          <el-input v-model="presaleLinkForm.orderNo" disabled></el-input>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="presaleLinkForm.confirmed ? 'success' : 'warning'">
            {{ presaleLinkForm.confirmed ? '已确认，不能修改' : '未确认，可修改' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="关联预销售单">
          <el-select
            v-model="presaleLinkForm.presaleOrderId"
            :disabled="presaleLinkForm.confirmed"
            filterable
            remote
            reserve-keyword
            style="width: 100%;"
            placeholder="输入预售合同号搜索"
            :loading="presaleOrderLoading"
            :remote-method="remoteSearchPresaleOrders"
            @visible-change="presaleOrderVisibleChange"
            @change="presaleOrderChangeHandle">
            <el-option
              v-for="item in presaleOrderOptions"
              :key="item.presaleOrderId"
              :label="item.sellerContractNo || item.presaleOrderNo"
              :value="item.presaleOrderId">
              <div class="product-option-code">{{ item.sellerContractNo || item.presaleOrderNo }}</div>
              <div class="product-option-name">{{ item.customerReference || '-' }} / {{ item.brandName || '-' }}</div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="presaleLinkVisible = false">关闭</el-button>
        <el-button
          v-if="!presaleLinkForm.confirmed"
          type="primary"
          :loading="presaleLinkSaving"
          @click="savePresaleLink()">
          保存关联
        </el-button>
        <el-button
          v-if="!presaleLinkForm.confirmed"
          type="success"
          :loading="presaleLinkConfirming"
          @click="confirmPresaleLink()">
          确认关联
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import SaleOrderDialog from './sale-order-dialog'

export default {
  components: {
    SaleOrderDialog
  },
  data () {
    return {
      queryForm: {
        keyword: '',
        saleType: '',
        status: ''
      },
      saleTypeOptions: [
        { value: 'FUTURES', label: '期货单' },
        { value: 'SPOT', label: '现货单' }
      ],
      statusOptions: [
        { value: '1', label: '待确认盖章合同' },
        { value: '2', label: '待确认二批打款凭证' },
        { value: '3', label: '待内部确认二批来款水单' },
        { value: '4', label: '待内部确认资方打款凭证' },
        { value: '5', label: '待确认出库回单' },
        { value: '6', label: '流程完成' }
      ],
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      dialogVisible: false,
      noticeSendingId: 0,
      presaleLinkVisible: false,
      presaleLinkSaving: false,
      presaleLinkConfirming: false,
      presaleOrderLoading: false,
      presaleOrderOptions: [],
      presaleLinkForm: {
        saleOrderId: '',
        orderNo: '',
        presaleOrderId: '',
        originalPresaleOrderId: '',
        sourcePresaleOrderNo: '',
        confirmed: false
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
        url: this.$http.adornUrl('/erp/saleorder/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword,
          saleType: this.queryForm.saleType,
          status: this.queryForm.status
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
    getSaleTypeLabel (value) {
      const target = this.saleTypeOptions.find(item => item.value === value)
      return target ? target.label : value
    },
    getStatusLabel (value) {
      const target = this.statusOptions.find(item => String(item.value) === String(value))
      return target ? target.label : '待处理'
    },
    getStatusType (value) {
      const map = {
        1: 'info',
        2: 'warning',
        3: 'warning',
        4: 'warning',
        5: 'warning',
        6: 'success'
      }
      return map[value] || 'info'
    },
    getUploadNoticeType (value) {
      const status = Number(value || 0)
      if (status === 9) return 'danger'
      if (status === 1 || status === 2) return 'success'
      return 'info'
    },
    openContract (url) {
      if (!url) {
        this.$message.error('合同链接不存在')
        return
      }
      window.open(url, '_blank')
    },
    copyContractUrl (url) {
      if (!url) {
        this.$message.error('合同链接不存在')
        return
      }
      const text = String(url)
      const fallbackCopy = () => {
        const input = document.createElement('textarea')
        input.value = text
        input.setAttribute('readonly', 'readonly')
        input.style.position = 'fixed'
        input.style.top = '-9999px'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      const success = () => this.$message.success('链接已复制')
      const failure = () => this.$message.error('复制失败，请手动复制')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(success).catch(() => {
          try {
            fallbackCopy()
            success()
          } catch (e) {
            failure()
          }
        })
        return
      }
      try {
        fallbackCopy()
        success()
      } catch (e) {
        failure()
      }
    },
    sendUploadNotice (row) {
      const sent = Number(row.uploadNoticeStatus || 0) === 1 || Number(row.uploadNoticeStatus || 0) === 2
      const run = () => {
        this.noticeSendingId = row.id
        this.$http({
          url: this.$http.adornUrl('/erp/wecom/sale-upload-notice/send'),
          method: 'post',
          data: this.$http.adornData({
            saleOrderId: row.id,
            force: sent
          })
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('已创建企业微信群发任务，请群主在企业微信里确认发送')
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '发送上传链接失败')
            this.getDataList()
          }
          this.noticeSendingId = 0
        }).catch(() => {
          this.noticeSendingId = 0
          this.getDataList()
        })
      }
      if (!sent) {
        run()
        return
      }
      this.$confirm('该销售单已经发送过上传链接，是否重新创建群发任务？', '重新发送上传链接', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(run).catch(() => {})
    },
    hasUploadedAttachment (row) {
      return Number(row.signedContractUploaded || 0) > 0 ||
        Number(row.buyerPaymentUploaded || 0) > 0 ||
        Number(row.buyerBankSlipUploaded || 0) > 0 ||
        Number(row.funderPaymentUploaded || 0) > 0
    },
    openPresaleLinkDialog (row) {
      if (row.saleType !== 'FUTURES') {
        this.$message.error('只有期货单需要关联预销售单')
        return
      }
      this.presaleLinkForm = {
        saleOrderId: row.id,
        orderNo: row.orderNo,
        presaleOrderId: row.sourcePresaleOrderId || '',
        originalPresaleOrderId: row.sourcePresaleOrderId || '',
        sourcePresaleOrderNo: row.sourcePresaleOrderNo || '',
        confirmed: Number(row.presaleLinkConfirmed || 0) === 1
      }
      this.presaleOrderOptions = row.sourcePresaleOrderId ? [{
        presaleOrderId: row.sourcePresaleOrderId,
        sellerContractNo: row.sourcePresaleOrderNo,
        presaleOrderNo: row.sourcePresaleOrderNo,
        customerReference: '',
        brandName: ''
      }] : []
      this.presaleLinkVisible = true
      if (!this.presaleOrderOptions.length) {
        this.remoteSearchPresaleOrders('')
      }
    },
    presaleOrderVisibleChange (visible) {
      if (visible && !this.presaleOrderOptions.length) {
        this.remoteSearchPresaleOrders('')
      }
    },
    remoteSearchPresaleOrders (keyword) {
      this.presaleOrderLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-orders'),
        method: 'get',
        params: this.$http.adornParams({ keyword: keyword || '' })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.presaleOrderOptions = data.list || []
        } else {
          this.presaleOrderOptions = []
        }
        this.presaleOrderLoading = false
      }).catch(() => {
        this.presaleOrderOptions = []
        this.presaleOrderLoading = false
      })
    },
    presaleOrderChangeHandle (value) {
      const target = this.presaleOrderOptions.find(item => item.presaleOrderId === value)
      this.presaleLinkForm.sourcePresaleOrderNo = target ? (target.sellerContractNo || target.presaleOrderNo || '') : ''
    },
    doSavePresaleLink () {
      return this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-link/update'),
        method: 'post',
        data: this.$http.adornData({
          saleOrderId: this.presaleLinkForm.saleOrderId,
          presaleOrderId: this.presaleLinkForm.presaleOrderId
        })
      })
    },
    savePresaleLink () {
      if (!this.presaleLinkForm.presaleOrderId) {
        this.$message.error('请选择关联预销售单')
        return
      }
      this.presaleLinkSaving = true
      this.doSavePresaleLink().then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('关联预销售单已保存')
          this.presaleLinkForm.originalPresaleOrderId = this.presaleLinkForm.presaleOrderId
          this.getDataList()
        } else {
          this.$message.error((data && data.msg) || '保存失败')
        }
        this.presaleLinkSaving = false
      }).catch(() => {
        this.presaleLinkSaving = false
      })
    },
    confirmPresaleLink () {
      if (!this.presaleLinkForm.presaleOrderId) {
        this.$message.error('请选择关联预销售单')
        return
      }
      this.$confirm('确认后该销售单的关联预销售单将不能再修改，是否继续？', '确认关联', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.presaleLinkConfirming = true
        const changed = String(this.presaleLinkForm.presaleOrderId || '') !== String(this.presaleLinkForm.originalPresaleOrderId || '')
        const savePromise = changed ? this.doSavePresaleLink() : Promise.resolve({ data: { code: 0 } })
        savePromise.then(({ data }) => {
          if (!data || data.code !== 0) {
            this.$message.error((data && data.msg) || '保存关联失败')
            this.presaleLinkConfirming = false
            return
          }
          this.$http({
            url: this.$http.adornUrl('/erp/saleorder/presale-link/confirm'),
            method: 'post',
            data: this.$http.adornData({ saleOrderId: this.presaleLinkForm.saleOrderId })
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message.success('关联预销售单已确认')
              this.presaleLinkVisible = false
              this.getDataList()
            } else {
              this.$message.error((data && data.msg) || '确认失败')
            }
            this.presaleLinkConfirming = false
          }).catch(() => {
            this.presaleLinkConfirming = false
          })
        }).catch(() => {
          this.presaleLinkConfirming = false
        })
      }).catch(() => {})
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
    addHandle () {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(0, false)
      })
    },
    viewHandle (id) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(id, true)
      })
    },
    editHandle (id) {
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.dialog.init(id, false)
      })
    },
    deleteHandle (id) {
      this.$confirm('确定删除这条销售单记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$http({
          url: this.$http.adornUrl('/erp/saleorder/delete'),
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
      }).catch(() => {})
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

.product-option-code {
  font-weight: 600;
  line-height: 20px;
}

.product-option-name {
  color: #8492a6;
  font-size: 12px;
  line-height: 18px;
}
</style>
