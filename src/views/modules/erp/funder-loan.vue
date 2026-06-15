<template>
  <div class="mod-funder-loan">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="贷款编号/预售单/合同号/资方" @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.status" clearable placeholder="还款状态">
          <el-option label="待还款" :value="0"></el-option>
          <el-option label="还款完成" :value="1"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="getDataList()">查询</el-button></el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="loanNo" label="贷款编号" min-width="190"></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="170"></el-table-column>
      <el-table-column prop="sellerContractNo" label="合同号" min-width="160"></el-table-column>
      <el-table-column prop="loanDate" label="首次打款日期" width="120" align="center"></el-table-column>
      <el-table-column label="贷款本金" width="140" align="right"><template slot-scope="scope">{{ money(scope.row.loanAmount) }}</template></el-table-column>
      <el-table-column label="年利率（%）" width="150" align="right"><template slot-scope="scope">{{ rate(scope.row.annualInterestRate) }}</template></el-table-column>
      <el-table-column label="已还本金" width="140" align="right"><template slot-scope="scope">{{ money(scope.row.repaidPrincipal) }}</template></el-table-column>
      <el-table-column label="剩余本金" width="140" align="right"><template slot-scope="scope"><strong>{{ money(scope.row.remainingPrincipal) }}</strong></template></el-table-column>
      <el-table-column label="累计利息" width="180" align="right"><template slot-scope="scope">{{ decimal10(scope.row.interestAmount) }}</template></el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope"><el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="small">{{ scope.row.status === 1 ? '还款完成' : '待还款' }}</el-tag></template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="170" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row.id)">还款明细</el-button>
          <el-button v-if="scope.row.status !== 1 && isAuth('erp:funderloan:update')" type="text" size="small" @click="openRepayment(scope.row)">新增还款</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle" @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog title="贷款及还款明细" :visible.sync="detailVisible" width="1200px">
      <el-descriptions v-if="detailData.id" :column="4" border>
        <el-descriptions-item label="贷款编号">{{ detailData.loanNo }}</el-descriptions-item>
        <el-descriptions-item label="资方">{{ detailData.funderName }}</el-descriptions-item>
        <el-descriptions-item label="预销售单号">{{ detailData.presaleOrderNo }}</el-descriptions-item>
        <el-descriptions-item label="合同号">{{ detailData.sellerContractNo }}</el-descriptions-item>
        <el-descriptions-item label="贷款本金">{{ money(detailData.loanAmount) }}</el-descriptions-item>
        <el-descriptions-item label="年利率">{{ rate(detailData.annualInterestRate) }}%</el-descriptions-item>
        <el-descriptions-item label="已还本金">{{ money(detailData.repaidPrincipal) }}</el-descriptions-item>
        <el-descriptions-item label="剩余本金">{{ money(detailData.remainingPrincipal) }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailData.repaymentList || []" border style="margin-top:16px" max-height="420">
        <el-table-column prop="lineNo" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="repaymentNo" label="还款编号" min-width="190"></el-table-column>
        <el-table-column prop="repaymentDate" label="还款日期" width="120"></el-table-column>
        <el-table-column prop="loanDays" label="贷款天数" width="100" align="right"></el-table-column>
        <el-table-column label="归还本金" width="140" align="right"><template slot-scope="scope">{{ money(scope.row.repaymentPrincipal) }}</template></el-table-column>
        <el-table-column label="利息金额" width="180" align="right"><template slot-scope="scope">{{ decimal10(scope.row.interestAmount) }}</template></el-table-column>
        <el-table-column label="手续费" width="130" align="right"><template slot-scope="scope">{{ money(scope.row.handlingFeeAmount) }}</template></el-table-column>
        <el-table-column prop="handlingFeeReason" label="手续费原因" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column label="预计打款金额" width="180" align="right"><template slot-scope="scope">{{ decimal10(scope.row.expectedPaymentAmount) }}</template></el-table-column>
        <el-table-column label="实际打款金额" width="150" align="right"><template slot-scope="scope">{{ money(scope.row.modifiedAmount) }}</template></el-table-column>
        <el-table-column label="金额核对" width="100" align="center">
          <template slot-scope="scope"><el-tag :type="scope.row.amountMatched === 1 ? 'success' : 'danger'" size="small">{{ scope.row.amountMatched === 1 ? '一致' : '有差异' }}</el-tag></template>
        </el-table-column>
        <el-table-column fixed="right" label="凭证" width="90" align="center">
          <template slot-scope="scope"><el-button type="text" size="small" @click="downloadRepayment(scope.row.id, scope.row.fileName)">下载</el-button></template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="新增还款" :visible.sync="repaymentVisible" width="820px" :close-on-click-modal="false">
      <el-alert title="本次输入的是归还本金，系统按首次资方打款日至本次还款日的自然日差计算利息。" type="info" :closable="false" style="margin-bottom:16px"></el-alert>
      <el-form ref="repaymentForm" :model="repaymentForm" :rules="repaymentRules" label-width="150px">
        <el-row :gutter="18">
          <el-col :span="12"><el-form-item label="贷款编号"><el-input :value="activeLoan.loanNo" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="贷款日期"><el-input :value="activeLoan.loanDate" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="剩余待还本金"><el-input :value="money(activeLoan.remainingPrincipal)" disabled></el-input></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="本次归还本金" prop="repaymentPrincipal">
              <el-input-number v-model="repaymentForm.repaymentPrincipal" :min="0" :max="Number(activeLoan.remainingPrincipal || 0)" :precision="2" :controls="false" style="width:100%" @change="calculateRepayment"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="还款日期" prop="repaymentDate">
              <el-date-picker v-model="repaymentForm.repaymentDate" type="date" value-format="yyyy-MM-dd" style="width:100%" @change="calculateRepayment"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="贷款天数"><el-input :value="repaymentForm.loanDays" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="年利率（%）"><el-input :value="rate(activeLoan.annualInterestRate)" disabled></el-input></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="利息金额"><el-input :value="decimal10(repaymentForm.interestAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item label="手续费金额">
              <el-input-number v-model="repaymentForm.handlingFeeAmount" :min="0" :precision="2" :controls="false" style="width:100%" @change="calculateRepayment"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手续费原因" prop="handlingFeeReason">
              <el-input v-model="repaymentForm.handlingFeeReason" maxlength="200" placeholder="填写手续费时必填" @blur="calculateRepayment"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item label="预计打款金额"><el-input :value="decimal10(repaymentForm.expectedPaymentAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="24">
            <el-form-item label="还款凭证" prop="filePath">
              <el-upload action="#" :show-file-list="false" :http-request="recognizeRepaymentVoucher" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="primary" plain :loading="recognizeLoading">上传并识别还款凭证</el-button>
              </el-upload>
              <span class="file-name">{{ repaymentForm.fileName || '尚未上传' }}</span>
              <div class="bank-voucher-tip">{{ bankVoucherSupportTip }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="修改金额" prop="modifiedAmount">
              <el-input-number v-model="repaymentForm.modifiedAmount" :min="0" :precision="2" :controls="false" style="width:100%"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="24" v-if="amountMismatch">
            <div class="amount-warning">实际打款金额与预计打款金额有差异，请核对。允许确认，但系统会保留差异标记。</div>
          </el-col>
        </el-row>
      </el-form>
      <span slot="footer">
        <el-button @click="repaymentVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="confirmRepayment()">确认还款</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
const emptyRepayment = loanId => ({
  loanId,
  repaymentPrincipal: 0,
  repaymentDate: '',
  loanDays: 0,
  interestAmount: 0,
  handlingFeeAmount: 0,
  handlingFeeReason: '',
  expectedPaymentAmount: 0,
  recognizedAmount: 0,
  modifiedAmount: 0,
  filePath: '',
  fileName: '',
  rawText: ''
})

export default {
  data () {
    return {
      queryForm: { keyword: '', status: '' },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      detailVisible: false,
      detailData: {},
      repaymentVisible: false,
      activeLoan: {},
      repaymentForm: emptyRepayment(null),
      bankVoucherSupportTip: '支持浦发银行、建设银行、工商银行、兴业银行、农发行电子回单样本，支持 PDF / JPG / PNG，识别后请核对金额和日期。',
      recognizeLoading: false,
      submitLoading: false,
      repaymentRules: {
        repaymentPrincipal: [{ required: true, message: '请输入本次归还本金', trigger: 'blur' }],
        repaymentDate: [{ required: true, message: '请选择还款日期', trigger: 'change' }],
        filePath: [{ required: true, message: '请上传还款凭证', trigger: 'change' }],
        modifiedAmount: [{ required: true, message: '请输入修改金额', trigger: 'blur' }],
        handlingFeeReason: [{
          validator: (rule, value, callback) => {
            if (Number(this.repaymentForm.handlingFeeAmount || 0) > 0 && !value) {
              callback(new Error('填写手续费时必须填写手续费原因'))
              return
            }
            callback()
          },
          trigger: 'blur'
        }]
      }
    }
  },
  computed: {
    amountMismatch () {
      return Math.round(Number(this.repaymentForm.modifiedAmount || 0) * 100) !== Math.round(Number(this.repaymentForm.expectedPaymentAmount || 0) * 100)
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    money (value) { return Number(value || 0).toFixed(2) },
    rate (value) { return Number(value || 0).toFixed(10) },
    decimal10 (value) { return Number(value || 0).toFixed(10) },
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/list'),
        method: 'get',
        params: this.$http.adornParams({ page: this.pageIndex, limit: this.pageSize, keyword: this.queryForm.keyword, status: this.queryForm.status })
      }).then(({ data }) => {
        this.dataListLoading = false
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.$message.error((data && data.msg) || '获取贷款明细失败')
        }
      }).catch(() => { this.dataListLoading = false })
    },
    sizeChangeHandle (value) { this.pageSize = value; this.pageIndex = 1; this.getDataList() },
    currentChangeHandle (value) { this.pageIndex = value; this.getDataList() },
    openDetail (id) {
      const loading = this.$loading({ lock: true, text: '正在加载贷款及还款明细...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/loan/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.detailData = data.loan || {}
          this.detailVisible = true
        } else {
          this.$message.error((data && data.msg) || '获取贷款详情失败')
        }
      }).finally(() => loading.close())
    },
    openRepayment (loan) {
      this.activeLoan = Object.assign({}, loan)
      this.repaymentForm = emptyRepayment(loan.id)
      this.repaymentVisible = true
      this.$nextTick(() => this.$refs.repaymentForm && this.$refs.repaymentForm.clearValidate())
    },
    calculateRepayment () {
      if (!this.repaymentForm.loanId || Number(this.repaymentForm.repaymentPrincipal || 0) <= 0 || !this.repaymentForm.repaymentDate) return
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/repayment/calculate'),
        method: 'post',
        data: this.$http.adornData(this.repaymentForm)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.repaymentForm = Object.assign({}, this.repaymentForm, data.repayment || {})
        } else {
          this.$message.error((data && data.msg) || '计算还款金额失败')
        }
      })
    },
    recognizeRepaymentVoucher (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.recognizeLoading = true
      const loading = this.$loading({ lock: true, text: '正在识别并归档还款凭证...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          this.repaymentForm.recognizedAmount = Number(voucher.recognizedAmount || 0)
          this.repaymentForm.modifiedAmount = Number(voucher.recognizedAmount || 0)
          this.repaymentForm.repaymentDate = voucher.paymentDate || this.repaymentForm.repaymentDate
          this.repaymentForm.filePath = voucher.filePath || ''
          this.repaymentForm.fileName = voucher.fileName || request.file.name
          this.repaymentForm.rawText = voucher.rawText || ''
          this.calculateRepayment()
          this.$message.success('还款凭证识别完成，请核对金额和日期')
        } else {
          this.$message.error((data && data.msg) || '还款凭证识别失败')
        }
      }).catch(() => this.$message.error('还款凭证识别请求失败')).finally(() => {
        this.recognizeLoading = false
        loading.close()
      })
    },
    confirmRepayment () {
      this.$refs.repaymentForm.validate(valid => {
        if (!valid) return
        if (Number(this.repaymentForm.repaymentPrincipal || 0) <= 0) {
          this.$message.error('本次归还本金必须大于0')
          return
        }
        if (Number(this.repaymentForm.handlingFeeAmount || 0) > 0 && !this.repaymentForm.handlingFeeReason) {
          this.$message.error('填写手续费时必须填写手续费原因')
          return
        }
        this.submitLoading = true
        const loading = this.$loading({ lock: true, text: '正在确认还款...' })
        this.$http({
          url: this.$http.adornUrl('/erp/funder-finance/loan/repayment/confirm'),
          method: 'post',
          data: this.$http.adornData(this.repaymentForm)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success(this.amountMismatch ? '还款已确认，金额差异已记录' : '还款已确认')
            this.repaymentVisible = false
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '确认还款失败')
          }
        }).catch(() => this.$message.error('确认还款请求失败')).finally(() => {
          this.submitLoading = false
          loading.close()
        })
      })
    },
    downloadRepayment (id, fileName) {
      const loading = this.$loading({ lock: true, text: '正在下载还款凭证...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/repayment/download/${id}`),
        method: 'get',
        responseType: 'blob'
      }).then(response => {
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || '还款凭证'
        link.click()
        URL.revokeObjectURL(url)
      }).finally(() => loading.close())
    }
  }
}
</script>

<style scoped>
.mod-funder-loan .el-pagination { margin-top: 15px; text-align: right; }
.file-name { margin-left: 12px; color: #606266; }
.bank-voucher-tip { color: #909399; font-size: 12px; line-height: 20px; margin-top: 4px; }
.amount-warning { color: #d93025; font-weight: 700; padding: 0 0 12px 150px; }
</style>
