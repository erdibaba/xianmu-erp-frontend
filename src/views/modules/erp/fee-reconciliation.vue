<template>
  <div class="mod-fee-reconciliation">
    <el-form :inline="true" :model="queryForm" class="query-form">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="批次号/销售单号/确认函合同号/资方" @keyup.enter.native="getDataList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.workflowStatus" clearable placeholder="对账状态">
          <el-option label="待对账" :value="0"></el-option>
          <el-option label="待确认" :value="1"></el-option>
          <el-option label="待财务打款" :value="2"></el-option>
          <el-option label="已完成" :value="3"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" @click="getDataList">查询</el-button></el-form-item>
      <el-form-item><el-button @click="resetQuery">重置</el-button></el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="batchNo" label="出库批次号" min-width="160" show-overflow-tooltip></el-table-column>
      <el-table-column prop="saleOrderNo" label="销售单号" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="confirmContractNos" label="确认函合同号" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="ownershipName" label="货权" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="settlementDate" label="核算日期" width="115" align="center"></el-table-column>
      <el-table-column label="系统预计应付" width="135" align="right">
        <template slot-scope="scope">{{ amount(scope.row.expectedPaymentAmount) }}</template>
      </el-table-column>
      <el-table-column label="资方核算金额" width="135" align="right">
        <template slot-scope="scope">{{ amount(scope.row.statementAmount) }}</template>
      </el-table-column>
      <el-table-column label="状态" width="120" align="center">
        <template slot-scope="scope">
          <el-tag :type="statusTag(scope.row.workflowStatus)" size="small">{{ scope.row.workflowStatusName }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="120" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openReconciliation(scope.row)">{{ actionText(scope.row.workflowStatus) }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="totalCount"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle" @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog title="出库批次费用对账" :visible.sync="dialogVisible" width="1280px" top="4vh" :close-on-click-modal="false">
      <div v-loading="dialogLoading" class="reconciliation-dialog-body">
        <el-steps :active="stepActive" finish-status="success" align-center class="workflow-steps">
          <el-step title="费用核对"></el-step>
          <el-step title="确认无误"></el-step>
          <el-step title="财务打款"></el-step>
          <el-step title="完成"></el-step>
        </el-steps>

        <el-descriptions :column="4" border size="small" class="base-info">
          <el-descriptions-item label="出库批次号">{{ form.batchNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="销售单号">{{ form.saleOrderNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="确认函合同号">{{ form.confirmContractNos || '-' }}</el-descriptions-item>
          <el-descriptions-item label="资方">{{ form.funderName || form.ownershipName || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-form :inline="true" label-width="120px" class="calculation-form">
          <el-form-item label="核算日期" required>
            <el-date-picker v-model="form.settlementDate" type="date" value-format="yyyy-MM-dd" :disabled="!reconciliationEditable" @change="recalculate"></el-date-picker>
          </el-form-item>
          <el-form-item label="计算扫码费">
            <el-switch v-model="includeCodeScanFee" :disabled="!reconciliationEditable" active-text="计算" inactive-text="不计算" @change="recalculate"></el-switch>
          </el-form-item>
          <el-form-item label="额外仓储天数">
            <el-input-number v-model="form.extraStorageDays" :min="0" :precision="0" :controls="false" :disabled="!reconciliationEditable" @change="recalculate"></el-input-number>
          </el-form-item>
          <el-form-item label="其他费用">
            <el-input-number v-model="form.otherFeeAmount" :precision="2" :controls="false" :disabled="!reconciliationEditable" @change="recalculate"></el-input-number>
          </el-form-item>
        </el-form>

        <div class="summary-grid">
          <div class="summary-item"><span>系统还本</span><strong>{{ amount(form.systemPrincipalAmount) }}</strong></div>
          <div class="summary-item"><span>利息/资金成本</span><strong>{{ amount(form.interestAmount) }}</strong></div>
          <div class="summary-item"><span>仓储费用</span><strong>{{ amount(form.storageFeeAmount) }}</strong></div>
          <div class="summary-item"><span>其他应付/扣减</span><strong>{{ amount(otherFees) }}</strong></div>
          <div class="summary-item important"><span>系统预计应付</span><strong>{{ amount(form.expectedPaymentAmount) }}</strong></div>
        </div>

        <div class="section-title">By产品费用明细</div>
        <el-table :data="form.itemList || []" border stripe size="mini" height="280">
          <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
          <el-table-column prop="confirmContractNo" label="确认函合同号" width="145" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="100"></el-table-column>
          <el-table-column prop="productName" label="品名" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" width="125" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="85"></el-table-column>
          <el-table-column prop="shippedBoxes" label="出库箱数" width="85" align="right"></el-table-column>
          <el-table-column label="计费重量KG" width="115" align="right"><template slot-scope="scope">{{ weight(scope.row.feeWeight) }}</template></el-table-column>
          <el-table-column label="确认函单价" width="105" align="right"><template slot-scope="scope">{{ unitPrice(scope.row.unitPriceInclTax) }}</template></el-table-column>
          <el-table-column label="结算销售单价" width="120" align="right"><template slot-scope="scope">{{ unitPrice(scope.row.settlementUnitPrice) }}</template></el-table-column>
          <el-table-column label="系统还本" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.systemPrincipalAmount) }}</template></el-table-column>
          <el-table-column label="预计应付" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.expectedPaymentAmount) }}</template></el-table-column>
        </el-table>

        <div class="section-title">资方计算单核对</div>
        <el-form :inline="true" label-width="120px">
          <el-form-item label="资方计算单" required>
            <el-upload v-if="reconciliationEditable" action="" :show-file-list="false" :http-request="uploadStatement">
              <el-button size="small" type="primary" :loading="statementUploading">上传资方计算单</el-button>
            </el-upload>
            <el-button v-if="form.statementFileName" type="text" @click="downloadStatement">{{ form.statementFileName }}</el-button>
          </el-form-item>
          <el-form-item label="资方核算金额" required>
            <el-input-number v-model="form.statementAmount" :min="0" :precision="2" :controls="false" :disabled="!reconciliationEditable"></el-input-number>
          </el-form-item>
          <el-form-item label="对账差异">
            <span :class="{ 'amount-difference': hasStatementDifference }">{{ amount(statementDifference) }}</span>
          </el-form-item>
        </el-form>
        <div v-if="hasStatementDifference" class="difference-tip">资方核算金额与系统预计应付金额存在差异，请核对。</div>

        <template v-if="Number(form.workflowStatus) >= 2">
          <div class="section-title">财务打款</div>
          <el-form :inline="true" label-width="120px">
            <el-form-item label="财务打款凭证" required>
              <el-upload v-if="Number(form.workflowStatus) === 2" action="" :show-file-list="false" :http-request="recognizePaymentVoucher">
                <el-button size="small" type="primary" :loading="paymentUploading">上传并识别凭证</el-button>
              </el-upload>
              <el-button v-if="form.fileName" type="text" @click="downloadPayment">{{ form.fileName }}</el-button>
            </el-form-item>
            <el-form-item label="确认打款金额" required>
              <el-input-number v-model="form.confirmedPaymentAmount" :min="0" :precision="2" :controls="false" :disabled="Number(form.workflowStatus) !== 2"></el-input-number>
            </el-form-item>
            <el-form-item label="实际打款日期" required>
              <el-date-picker v-model="form.paymentDate" type="date" value-format="yyyy-MM-dd" :disabled="Number(form.workflowStatus) !== 2"></el-date-picker>
            </el-form-item>
            <el-form-item label="打款差异">
              <span :class="{ 'amount-difference': hasPaymentDifference }">{{ amount(paymentDifference) }}</span>
            </el-form-item>
          </el-form>
          <div v-if="hasPaymentDifference" class="difference-tip">确认打款金额与已确认的资方核算金额存在差异，请核对。</div>
        </template>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="reconciliationEditable" type="primary" :loading="submitLoading" @click="saveReconciliation">保存对账资料</el-button>
        <el-button v-if="Number(form.workflowStatus) === 1" type="success" :loading="submitLoading" @click="confirmReconciliation">确认核对无误</el-button>
        <el-button v-if="Number(form.workflowStatus) === 2" type="success" :loading="submitLoading" @click="confirmPayment">确认财务打款</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
const emptyForm = () => ({
  id: null,
  outboundBatchId: null,
  batchNo: '',
  saleOrderNo: '',
  confirmContractNos: '',
  funderName: '',
  ownershipName: '',
  settlementDate: '',
  workflowStatus: 0,
  includeCodeScanFee: 0,
  extraStorageDays: 0,
  otherFeeAmount: 0,
  expectedPaymentAmount: 0,
  statementAmount: 0,
  statementFilePath: '',
  statementFileName: '',
  recognizedPaymentAmount: 0,
  confirmedPaymentAmount: 0,
  paymentDate: '',
  filePath: '',
  fileName: '',
  rawText: '',
  itemList: []
})

export default {
  data () {
    return {
      queryForm: { keyword: '', workflowStatus: '' },
      dataList: [],
      dataListLoading: false,
      pageIndex: 1,
      pageSize: 20,
      totalCount: 0,
      dialogVisible: false,
      dialogLoading: false,
      statementUploading: false,
      paymentUploading: false,
      submitLoading: false,
      form: emptyForm()
    }
  },
  computed: {
    reconciliationEditable () {
      return Number(this.form.workflowStatus || 0) <= 1
    },
    includeCodeScanFee: {
      get () { return Number(this.form.includeCodeScanFee || 0) === 1 },
      set (value) { this.form.includeCodeScanFee = value ? 1 : 0 }
    },
    stepActive () {
      const status = Number(this.form.workflowStatus || 0)
      return status === 0 ? 0 : status
    },
    otherFees () {
      const f = this.form
      return Number(f.codeScanFeeAmount || 0) + Number(f.stampTaxAmount || 0) - Number(f.depositAmount || 0) +
        Number(f.taxAdjustAmount || 0) + Number(f.grossWeightFeeAmount || 0) + Number(f.otherFeeAmount || 0)
    },
    statementDifference () {
      return Number(this.form.statementAmount || 0) - Number(this.form.expectedPaymentAmount || 0)
    },
    hasStatementDifference () {
      return Math.abs(this.statementDifference) >= 0.01
    },
    paymentDifference () {
      return Number(this.form.confirmedPaymentAmount || 0) - Number(this.form.statementAmount || 0)
    },
    hasPaymentDifference () {
      return Math.abs(this.paymentDifference) >= 0.01
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/fee-reconciliation/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword,
          workflowStatus: this.queryForm.workflowStatus
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataList = (data.page && data.page.list) || []
          this.totalCount = (data.page && data.page.totalCount) || 0
        } else {
          this.$message.error((data && data.msg) || '获取费用对账列表失败')
        }
      }).catch(() => this.$message.error('获取费用对账列表失败，请检查后端服务')).finally(() => {
        this.dataListLoading = false
      })
    },
    resetQuery () {
      this.queryForm = { keyword: '', workflowStatus: '' }
      this.pageIndex = 1
      this.getDataList()
    },
    sizeChangeHandle (value) {
      this.pageSize = value
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (value) {
      this.pageIndex = value
      this.getDataList()
    },
    openReconciliation (row) {
      this.form = emptyForm()
      this.dialogVisible = true
      this.dialogLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/fee-reconciliation/info'),
        method: 'get',
        params: this.$http.adornParams({ settlementId: row.settlementId || '', outboundBatchId: row.outboundBatchId || '' })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.form = Object.assign(emptyForm(), data.settlement || {})
          if (!this.form.statementAmount && Number(this.form.workflowStatus || 0) === 0) {
            this.form.statementAmount = Number(this.form.expectedPaymentAmount || 0)
          }
        } else {
          this.$message.error((data && data.msg) || '加载费用对账失败')
        }
      }).catch(() => this.$message.error('加载费用对账失败，请检查后端服务')).finally(() => {
        this.dialogLoading = false
      })
    },
    recalculate () {
      if (!this.reconciliationEditable || !this.form.outboundBatchId || !this.form.settlementDate) return
      const preserved = {
        id: this.form.id,
        workflowStatus: this.form.workflowStatus,
        statementAmount: this.form.statementAmount,
        statementFilePath: this.form.statementFilePath,
        statementFileName: this.form.statementFileName,
        remark: this.form.remark
      }
      this.dialogLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/batch-settlement/calculate'),
        method: 'post',
        data: this.$http.adornData(this.form)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.form = Object.assign(emptyForm(), data.settlement || {}, preserved)
        } else {
          this.$message.error((data && data.msg) || '重新计算费用失败')
        }
      }).finally(() => { this.dialogLoading = false })
    },
    uploadStatement (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.statementUploading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/fee-reconciliation/statement/upload'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const file = data.file || {}
          this.form.statementFilePath = file.filePath || ''
          this.form.statementFileName = file.fileName || request.file.name
          this.$message.success('资方计算单已归档')
        } else {
          this.$message.error((data && data.msg) || '上传资方计算单失败')
        }
      }).catch(() => this.$message.error('上传资方计算单失败')).finally(() => { this.statementUploading = false })
    },
    saveReconciliation () {
      if (!this.form.statementFilePath) return this.$message.error('请先上传资方计算单据')
      if (Number(this.form.statementAmount || 0) <= 0) return this.$message.error('资方核算金额必须大于0')
      this.runWithLoading('正在保存费用对账资料...', '/erp/funder-finance/fee-reconciliation/save', this.form).then(data => {
        if (data && data.code === 0) {
          this.form = Object.assign(emptyForm(), data.settlement || {})
          this.$message.success('费用对账资料已保存')
          this.getDataList()
        }
      })
    },
    confirmReconciliation () {
      this.$confirm('确认资方计算单及系统费用核对无误？确认后费用不可修改。', '确认核对', { type: 'warning' }).then(() => {
        return this.runWithLoading('正在确认费用核对...', `/erp/funder-finance/fee-reconciliation/confirm/${this.form.id}`, {})
      }).then(data => {
        if (data && data.code === 0) {
          this.form.workflowStatus = 2
          this.form.confirmedPaymentAmount = Number(this.form.statementAmount || this.form.expectedPaymentAmount || 0)
          this.$message.success('核对已确认，请财务上传打款凭证')
          this.getDataList()
        }
      }).catch(() => {})
    },
    recognizePaymentVoucher (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.paymentUploading = true
      const loading = this.$loading({ lock: true, text: '正在识别并归档财务打款凭证...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          this.form.recognizedPaymentAmount = Number(voucher.recognizedAmount || 0)
          this.form.confirmedPaymentAmount = Number(voucher.recognizedAmount || 0)
          this.form.paymentDate = voucher.paymentDate || this.form.paymentDate
          this.form.filePath = voucher.filePath || ''
          this.form.fileName = voucher.fileName || request.file.name
          this.form.rawText = voucher.rawText || ''
          this.$message.success('财务打款凭证识别完成，请确认金额和日期')
        } else {
          this.$message.error((data && data.msg) || '识别财务打款凭证失败')
        }
      }).catch(() => this.$message.error('识别财务打款凭证失败')).finally(() => {
        this.paymentUploading = false
        loading.close()
      })
    },
    confirmPayment () {
      if (!this.form.filePath) return this.$message.error('请先上传财务打款凭证')
      if (Number(this.form.confirmedPaymentAmount || 0) <= 0) return this.$message.error('确认打款金额必须大于0')
      if (!this.form.paymentDate) return this.$message.error('请选择实际打款日期')
      this.$confirm('确认财务已完成打款？确认后将生成还款记录并扣减贷款余额。', '确认财务打款', { type: 'warning' }).then(() => {
        return this.runWithLoading('正在生成还款记录...', '/erp/funder-finance/fee-reconciliation/payment/confirm', this.form)
      }).then(data => {
        if (data && data.code === 0) {
          this.form.workflowStatus = 3
          this.$message.success('财务打款已确认，费用对账完成')
          this.getDataList()
        }
      }).catch(() => {})
    },
    runWithLoading (text, url, payload) {
      this.submitLoading = true
      const loading = this.$loading({ lock: true, text })
      return this.$http({
        url: this.$http.adornUrl(url),
        method: 'post',
        data: this.$http.adornData(payload)
      }).then(({ data }) => {
        if (!data || data.code !== 0) {
          this.$message.error((data && data.msg) || '操作失败')
        }
        return data
      }).catch(error => {
        this.$message.error((error.response && error.response.data && error.response.data.msg) || '请求失败，请检查后端服务')
        throw error
      }).finally(() => {
        this.submitLoading = false
        loading.close()
      })
    },
    downloadStatement () {
      if (this.form.id) this.download(`/erp/funder-finance/fee-reconciliation/statement/download/${this.form.id}`, this.form.statementFileName)
    },
    downloadPayment () {
      if (this.form.id) this.download(`/erp/funder-finance/fee-reconciliation/payment/download/${this.form.id}`, this.form.fileName)
    },
    download (url, fileName) {
      const loading = this.$loading({ lock: true, text: '正在获取文件...' })
      this.$http({ url: this.$http.adornUrl(url), method: 'get', responseType: 'blob' }).then(response => {
        const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName || '附件'
        link.click()
        URL.revokeObjectURL(link.href)
      }).catch(() => this.$message.error('获取文件失败')).finally(() => loading.close())
    },
    statusTag (status) {
      return ['warning', '', 'danger', 'success'][Number(status || 0)] || 'info'
    },
    actionText (status) {
      return ['开始对账', '继续核对', '财务打款', '查看'][Number(status || 0)] || '查看'
    },
    amount (value) {
      if (value === null || value === undefined || value === '') return '-'
      return Number(value || 0).toFixed(2)
    },
    weight (value) { return Number(value || 0).toFixed(11) },
    unitPrice (value) { return Number(value || 0).toFixed(6) }
  }
}
</script>

<style scoped>
.query-form { margin-bottom: 4px; }
.workflow-steps { margin: 0 20px 20px; }
.base-info { margin-bottom: 16px; }
.calculation-form { padding: 14px 12px 0; background: #f7faf9; border: 1px solid #e3ece9; }
.summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin: 14px 0; }
.summary-item { padding: 12px 14px; background: #f5f7fa; border-radius: 4px; }
.summary-item span { display: block; color: #707780; font-size: 13px; margin-bottom: 7px; }
.summary-item strong { font-size: 18px; color: #263238; }
.summary-item.important { background: #eaf6f4; }
.summary-item.important strong { color: #168b80; }
.section-title { margin: 16px 0 10px; padding-left: 9px; border-left: 3px solid #168b80; font-weight: 700; }
.amount-difference, .difference-tip { color: #f04444; font-weight: 600; }
.difference-tip { margin: -5px 0 8px 120px; font-size: 12px; }
.reconciliation-dialog-body { min-height: 480px; max-height: 76vh; overflow-y: auto; padding-right: 4px; }
@media (max-width: 900px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
