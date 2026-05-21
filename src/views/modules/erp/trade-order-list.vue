<template>
  <div class="mod-erp-trade-order">
    <el-alert
      :title="alertText"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" style="margin-top: 15px;">
      <el-form-item>
        <el-input v-model="queryForm.keyword" placeholder="单号/单位/合同号" clearable @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.status" clearable placeholder="状态">
          <el-option
            v-for="item in orderStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.bizType" :disabled="!!fixedBizType" clearable placeholder="业务类型">
          <el-option
            v-for="item in bizTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.paymentStatus" clearable placeholder="付款状态">
          <el-option
            v-for="item in paymentStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.invoiceStatus" clearable placeholder="开票状态">
          <el-option
            v-for="item in invoiceStatusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:tradeorder:save')" type="success" @click="addOrUpdateHandle()">新增</el-button>
        <el-button v-if="isAuth('erp:tradeorder:save')" type="warning" @click="ocrHandle()">拍照识别</el-button>
        <el-button v-if="isAuth('erp:tradeorder:list')" type="info" @click="exportFinanceHandle()">导出好会计</el-button>
        <el-button v-if="isAuth('erp:tradeorder:delete')" type="danger" :disabled="dataListSelections.length <= 0" @click="deleteHandle()">批量删除</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading" @selection-change="selectionChangeHandle" style="margin-top: 15px;">
      <el-table-column type="selection" width="50" align="center" header-align="center"></el-table-column>
      <el-table-column prop="orderNo" label="单号" min-width="150" align="center" header-align="center"></el-table-column>
      <el-table-column prop="partnerName" label="往来单位" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="secondaryPartnerName" label="二批主体" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="contractNo" label="合同号" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="业务类型" min-width="130" align="center" header-align="center">
        <template slot-scope="scope">{{ bizTypeLabel(scope.row.bizType) }}</template>
      </el-table-column>
      <el-table-column prop="containerNo" label="柜号" min-width="120" align="center" header-align="center"></el-table-column>
      <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="sourceOrderNo" label="来源单号" min-width="140" show-overflow-tooltip></el-table-column>
      <el-table-column prop="orderDate" label="订单日期" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column prop="expectedDate" label="预计日期" min-width="160" align="center" header-align="center"></el-table-column>
      <el-table-column prop="itemAmount" label="货款金额" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="expenseAmount" label="费用金额" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="taxAmount" label="税额" width="110" align="right" header-align="center"></el-table-column>
      <el-table-column prop="totalAmount" label="总金额" width="120" align="right" header-align="center"></el-table-column>
      <el-table-column label="状态" width="90" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.status === 1 ? 'success' : 'info'">{{ statusLabel(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="付款" width="90" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.paymentStatus === 2 ? 'success' : (scope.row.paymentStatus === 1 ? 'warning' : 'info')">{{ paymentStatusLabel(scope.row.paymentStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开票" width="90" align="center" header-align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="scope.row.invoiceStatus === 2 ? 'success' : (scope.row.invoiceStatus === 1 ? 'warning' : 'info')">{{ invoiceStatusLabel(scope.row.invoiceStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="190" align="center" header-align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="addOrUpdateHandle(scope.row.id, true)">查看</el-button>
          <el-button v-if="isAuth('erp:tradeorder:update')" type="text" size="small" @click="addOrUpdateHandle(scope.row.id, false)">修改</el-button>
          <el-button v-if="isAuth('erp:tradeorder:delete')" type="text" size="small" @click="deleteHandle(scope.row.id)">删除</el-button>
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

    <trade-order-dialog
      v-if="dialogVisible"
      ref="dialog"
      :order-type="orderType"
      :default-biz-type="fixedBizType || defaultBizType"
      :lock-biz-type="!!fixedBizType"
      :title="title"
      @refreshDataList="getDataList">
    </trade-order-dialog>

    <ocr-recognize-dialog
      v-if="ocrVisible"
      ref="ocrDialog"
      :order-type="orderType"
      @recognized="recognizedHandle">
    </ocr-recognize-dialog>
  </div>
</template>

<script>
  import TradeOrderDialog from './trade-order-dialog'
  import OcrRecognizeDialog from './ocr-recognize-dialog'
  import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS, INVOICE_STATUS_OPTIONS, BIZ_TYPE_OPTIONS, getOptionLabel } from './const'

  export default {
    props: {
      orderType: {
        type: String,
        default: 'PURCHASE'
      },
      fixedBizType: {
        type: String,
        default: ''
      },
      defaultBizType: {
        type: String,
        default: ''
      },
      title: {
        type: String,
        default: '单据'
      }
    },
    data () {
      return {
        queryForm: {
          keyword: '',
          status: '',
          bizType: this.fixedBizType || this.defaultBizType || '',
          paymentStatus: '',
          invoiceStatus: ''
        },
        dataList: [],
        pageIndex: 1,
        pageSize: 10,
        totalPage: 0,
        dataListLoading: false,
        dataListSelections: [],
        dialogVisible: false,
        ocrVisible: false,
        orderStatusOptions: ORDER_STATUS_OPTIONS,
        paymentStatusOptions: PAYMENT_STATUS_OPTIONS,
        invoiceStatusOptions: INVOICE_STATUS_OPTIONS,
        bizTypeOptions: BIZ_TYPE_OPTIONS
      }
    },
    components: {
      TradeOrderDialog,
      OcrRecognizeDialog
    },
    computed: {
      alertText () {
        if (this.orderType === 'PURCHASE') {
          return '采购入库单按件数和重量双轨记录，完成后会生成库存流水，并可联动预销售自动生成赎单。'
        }
        if (this.fixedBizType === 'PRESALE') {
          return '预销售单必须绑定二批主体和上游关联合同；后续采购入库后，系统会按匹配规则自动生成出库赎单。'
        }
        return '销售/赎单支持仓储费自动计算、付款开票状态管理，以及导出好会计所需的核对台账。'
      }
    },
    activated () {
      this.getDataList()
    },
    methods: {
      statusLabel (value) {
        return getOptionLabel(this.orderStatusOptions, value)
      },
      paymentStatusLabel (value) {
        return getOptionLabel(this.paymentStatusOptions, value)
      },
      invoiceStatusLabel (value) {
        return getOptionLabel(this.invoiceStatusOptions, value)
      },
      bizTypeLabel (value) {
        return getOptionLabel(this.bizTypeOptions, value)
      },
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl(`/erp/tradeorder/list/${this.orderType}`),
          method: 'get',
          params: this.$http.adornParams({
            page: this.pageIndex,
            limit: this.pageSize,
            keyword: this.queryForm.keyword,
            status: this.queryForm.status,
            bizType: this.fixedBizType || this.queryForm.bizType,
            paymentStatus: this.queryForm.paymentStatus,
            invoiceStatus: this.queryForm.invoiceStatus
          })
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.dataList = data.page.list || []
            this.totalPage = data.page.totalCount
          } else {
            this.dataList = []
            this.totalPage = 0
            this.$message.error(data.msg || '获取数据失败')
          }
          this.dataListLoading = false
        }).catch(() => {
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
      selectionChangeHandle (val) {
        this.dataListSelections = val
      },
      addOrUpdateHandle (id, readonly) {
        this.dialogVisible = true
        this.$nextTick(() => {
          this.$refs.dialog.init(id, readonly)
        })
      },
      ocrHandle () {
        this.ocrVisible = true
        this.$nextTick(() => {
          this.$refs.ocrDialog.init()
        })
      },
      recognizedHandle (draft) {
        this.dialogVisible = true
        this.$nextTick(() => {
          draft.bizType = draft.bizType || this.fixedBizType || this.defaultBizType || draft.bizType
          this.$refs.dialog.initFromDraft(draft, false)
        })
      },
      exportFinanceHandle () {
        this.$http({
          url: this.$http.adornUrl(`/erp/tradeorder/export/finance/${this.orderType}`),
          method: 'get',
          responseType: 'blob',
          params: this.$http.adornParams({
            keyword: this.queryForm.keyword,
            status: this.queryForm.status,
            bizType: this.fixedBizType || this.queryForm.bizType,
            paymentStatus: this.queryForm.paymentStatus,
            invoiceStatus: this.queryForm.invoiceStatus
          })
        }).then((response) => {
          const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${this.title || '单据'}-好会计导出.xls`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        })
      },
      deleteHandle (id) {
        const ids = id ? [id] : this.dataListSelections.map(item => item.id)
        this.$confirm(`确定对[id=${ids.join(',')}]进行[删除]操作?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.$http({
            url: this.$http.adornUrl('/erp/tradeorder/delete'),
            method: 'post',
            data: this.$http.adornData(ids, false)
          }).then(({ data }) => {
            if (data && data.code === 0) {
              this.$message({
                message: '操作成功',
                type: 'success',
                duration: 1500,
                onClose: () => {
                  this.getDataList()
                }
              })
            } else {
              this.$message.error(data.msg || '删除失败')
            }
          })
        })
      }
    }
  }
</script>
