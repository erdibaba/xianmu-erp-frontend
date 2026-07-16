<template>
  <div class="mod-fee-reconciliation">
    <el-form :inline="true" :model="queryForm" class="query-form">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="批次号/销售单号/确认函合同号/客户/货权" @keyup.enter.native="getDataList"></el-input>
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
      <el-table-column prop="customerName" label="客户" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column prop="ownershipName" label="货权" min-width="180" show-overflow-tooltip></el-table-column>
      <el-table-column label="核算日期" width="115" align="center">
        <template slot-scope="scope">{{ dateOnly(scope.row.settlementDate) }}</template>
      </el-table-column>
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

    <el-dialog title="按出库批次费用对账" :visible.sync="dialogVisible" width="1280px" top="4vh" custom-class="batch-settlement-dialog" :close-on-click-modal="false">
      <div v-loading="dialogLoading" class="reconciliation-dialog-body">
        <div class="reconciliation-scroll-area">
          <el-alert :title="workflowNotice" type="info" :closable="false" style="margin-bottom:16px"></el-alert>
          <el-form :model="form" label-width="150px">
          <el-row :gutter="18">
            <el-col :span="12"><el-form-item label="出库批次"><el-input :value="batchDisplayName" disabled></el-input></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="结算日期" required><el-date-picker v-model="form.settlementDate" type="date" value-format="yyyy-MM-dd" style="width:100%" :disabled="!reconciliationEditable" @change="recalculate"></el-date-picker></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="资方规则"><el-input :value="ruleName(form.ruleType)" disabled></el-input></el-form-item></el-col>
            <el-col :span="6"><el-form-item label="计算扫码费"><el-switch v-model="includeCodeScanFee" :disabled="!reconciliationEditable" active-text="计算" inactive-text="不计算" @change="recalculate"></el-switch></el-form-item></el-col>
            <el-col v-if="form.ruleType === 'CHAOYUE'" :span="8"><el-form-item label="资方认定回款本金"><el-input-number v-model="form.confirmedPrincipalAmount" :min="0" :precision="2" :controls="false" style="width:100%" :disabled="!reconciliationEditable" @change="recalculate"></el-input-number></el-form-item></el-col>
            <el-col v-if="form.ruleType === 'WANXIANG'" :span="8"><el-form-item label="补税点费用"><el-input :value="amount(form.taxAdjustAmount)" disabled></el-input></el-form-item></el-col>
            <el-col v-if="form.ruleType === 'WANXIANG'" :span="8"><el-form-item label="毛重费用"><el-input :value="amount(form.grossWeightFeeAmount)" disabled></el-input></el-form-item></el-col>
            <el-col v-if="form.ruleType === 'WANXIANG'" :span="8"><el-form-item label="额外仓储天数"><el-input-number v-model="form.extraStorageDays" :min="0" :precision="0" :controls="false" style="width:100%" :disabled="!reconciliationEditable" @change="recalculate"></el-input-number></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="其他费用"><el-input-number v-model="form.otherFeeAmount" :min="0" :precision="2" :controls="false" style="width:100%" :disabled="!reconciliationEditable" @change="recalculate"></el-input-number></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="系统还本"><el-input :value="amount(form.systemPrincipalAmount)" disabled></el-input></el-form-item></el-col>
            <el-col :span="8"><el-form-item label="确认还本"><el-input :value="amount(form.confirmedPrincipalAmount)" disabled></el-input></el-form-item></el-col>
            <el-col :span="24">
              <div class="fee-summary-card">
                <div class="fee-summary-head"><span>费用说明</span><el-button type="text" icon="el-icon-question" @click="formulaDialogVisible = true">查看计算明细</el-button></div>
                <div class="fee-summary-grid">
                  <div class="fee-summary-item"><span>利息/资金成本</span><strong>¥{{ amount(form.interestAmount) }}</strong></div>
                  <div class="fee-summary-item"><span>{{ storageFeeName }}</span><strong>¥{{ amount(form.storageFeeAmount) }}</strong></div>
                  <div class="fee-summary-item"><span>其他应付/扣减费用</span><strong>¥{{ amount(otherFees) }}</strong></div>
                </div>
              </div>
            </el-col>
            <el-col :span="8"><el-form-item label="系统预计应付"><el-input :value="amount(form.expectedPaymentAmount)" disabled></el-input></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="备注"><el-input v-model="form.remark" maxlength="500" :disabled="!reconciliationEditable"></el-input></el-form-item></el-col>
          </el-row>
          </el-form>

          <el-table class="batch-settlement-item-table" :data="form.itemList || []" border stripe height="420">
          <el-table-column prop="lineNo" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="confirmContractNo" label="确认函合同号" width="145" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="100"></el-table-column>
          <el-table-column prop="productName" label="品名" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" width="125" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="85"></el-table-column>
          <el-table-column prop="shippedBoxes" label="出库箱数" width="85" align="right"></el-table-column>
          <el-table-column label="计费重量KG" width="115" align="right"><template slot-scope="scope">{{ weight(scope.row.feeWeight) }}</template></el-table-column>
          <el-table-column label="仓储费率(元/吨/天)" width="155" align="right"><template slot-scope="scope">{{ amount(scope.row.storageFeeRate) }}</template></el-table-column>
          <el-table-column prop="warehouseRateEffectiveDate" label="费率生效日" width="110"></el-table-column>
          <el-table-column label="确认函单价" width="105" align="right"><template slot-scope="scope">{{ unitPrice(scope.row.unitPriceInclTax) }}</template></el-table-column>
          <el-table-column label="结算销售单价" width="150" align="right"><template slot-scope="scope"><span>{{ unitPrice(scope.row.settlementUnitPrice) }}</span><el-popover placement="top" width="460" trigger="click"><div>{{ settlementPriceFormula(scope.row) }}</div><i slot="reference" class="el-icon-question settlement-price-icon"></i></el-popover></template></el-table-column>
          <el-table-column label="货值金额" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.costAmount) }}</template></el-table-column>
          <el-table-column label="系统还本" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.systemPrincipalAmount) }}</template></el-table-column>
          <el-table-column label="确认还本" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.confirmedPrincipalAmount) }}</template></el-table-column>
          <el-table-column prop="loanDays" label="计息天数" width="90" align="right"></el-table-column>
          <el-table-column label="利息/资金成本" width="130" align="right"><template slot-scope="scope">{{ amount(scope.row.interestAmount) }}</template></el-table-column>
          <el-table-column label="预计应付" width="110" align="right"><template slot-scope="scope">{{ amount(scope.row.expectedPaymentAmount) }}</template></el-table-column>
          </el-table>
        </div>

        <div class="reconciliation-dock">
          <template v-if="Number(form.workflowStatus) <= 1">
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
          </template>

          <template v-else>
            <div class="confirmed-statement-bar">
              <strong>已确认资方计算单</strong>
              <el-button v-if="form.statementFileName" type="text" @click="downloadStatement">{{ form.statementFileName }}</el-button>
              <span>资方核算金额：¥{{ amount(form.statementAmount) }}</span>
              <span :class="{ 'amount-difference': hasStatementDifference }">对账差异：¥{{ amount(statementDifference) }}</span>
            </div>
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
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="reconciliationEditable" type="primary" :loading="submitLoading" @click="saveReconciliation">保存对账资料</el-button>
        <el-button v-if="Number(form.workflowStatus) === 1" type="success" :loading="submitLoading" @click="confirmReconciliation">确认核对无误</el-button>
        <el-button v-if="Number(form.workflowStatus) === 2" type="success" :loading="submitLoading" @click="confirmPayment">确认财务打款</el-button>
      </span>
    </el-dialog>

    <el-dialog title="费用计算说明" :visible.sync="formulaDialogVisible" width="1180px" append-to-body>
      <el-alert :title="feeRuleText" type="info" :closable="false" class="formula-alert"></el-alert>
      <el-collapse v-model="feeExplainActiveNames" class="formula-collapse">
        <el-collapse-item title="应付金额汇总公式" name="summary">
          <el-table :data="feeSummaryRows" border stripe size="mini"><el-table-column prop="name" label="项目" width="170"></el-table-column><el-table-column label="金额" width="140" align="right"><template slot-scope="scope">{{ feeAmount(scope.row) }}</template></el-table-column><el-table-column prop="formula" label="计算公式" min-width="680"></el-table-column></el-table>
        </el-collapse-item>
        <el-collapse-item title="费用项目规则" name="rules">
          <el-table :data="feeRuleRows" border stripe size="mini"><el-table-column prop="name" label="费用项目" width="170"></el-table-column><el-table-column prop="formula" label="计算规则/来源" min-width="760"></el-table-column></el-table>
        </el-collapse-item>
        <el-collapse-item title="By产品代入公式" name="detail">
          <el-table :data="feeDetailRows" border stripe size="mini" max-height="420"><el-table-column prop="lineNo" label="行号" width="60" align="center"></el-table-column><el-table-column prop="confirmContractNo" label="确认函合同号" width="145"></el-table-column><el-table-column prop="productCode" label="产品编码" width="100"></el-table-column><el-table-column prop="productName" label="品名" min-width="140" show-overflow-tooltip></el-table-column><el-table-column prop="warehouseName" label="仓库" width="180" show-overflow-tooltip></el-table-column><el-table-column prop="feeName" label="计算项目" width="150"></el-table-column><el-table-column label="金额" width="125" align="right"><template slot-scope="scope">{{ feeAmount(scope.row) }}</template></el-table-column><el-table-column prop="formula" label="实际代入公式" min-width="700"></el-table-column></el-table>
        </el-collapse-item>
      </el-collapse>
      <span slot="footer"><el-button @click="formulaDialogVisible = false">关闭</el-button></span>
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
      formulaDialogVisible: false,
      feeExplainActiveNames: ['summary'],
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
    workflowNotice () {
      const messages = [
        '请按系统计算结果核对费用，上传资方计算单后保存。',
        '资方计算单已保存，请核对差异并确认无误。',
        '费用已核对确认，请财务上传打款凭证并确认打款。',
        '本批次费用对账及财务打款已完成，当前为只读查看。'
      ]
      return messages[Number(this.form.workflowStatus || 0)] || messages[0]
    },
    batchDisplayName () {
      return `${this.form.confirmContractNos || '-'} / ${this.form.batchNo || '-'} / ${this.form.saleOrderNo || '-'} / ${this.form.ownershipName || this.form.funderName || '-'}`
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
    },
    storageFeeName () {
      return this.form.ruleType === 'WANXIANG' ? '额外仓储费' : '仓储费用'
    },
    goodsValueTotal () {
      return (this.form.itemList || []).reduce((total, item) => total + Number(item.costAmount || 0), 0)
    },
    feeRuleText () {
      return `当前资方规则：${this.ruleName(this.form.ruleType)}。公式中的单价、费率、天数和金额均保存为本次对账快照，历史查看不会按最新费率重新计算。`
    },
    feeSummaryRows () {
      const f = this.form
      const expectedFormula = `货值${this.amount(this.goodsValueTotal)} + ${this.storageFeeName}${this.amount(f.storageFeeAmount)} + 扫码费${this.amount(this.effectiveCodeScanFee)} + 印花税${this.amount(f.stampTaxAmount)} - 保证金/押金${this.precise(f.depositAmount)} + 补税点费用${this.amount(f.taxAdjustAmount)} + 毛重费用${this.amount(f.grossWeightFeeAmount)} + 其他费用${this.amount(f.otherFeeAmount)} = ${this.amount(f.expectedPaymentAmount)}`
      return [
        { name: '货值金额', amount: this.goodsValueTotal, formula: '各产品行：计费重量KG × 结算销售单价，然后汇总。' },
        { name: '利息/资金成本（说明项）', amount: f.interestAmount, formula: '按确认还本、年利率和计息天数计算；已包含在结算销售单价规则中，不重复加入预计应付。' },
        { name: '装卸费（说明项）', amount: f.handlingFeeAmount, formula: '按计费重量和仓库费用历史计算；已包含在结算销售单价规则中，不重复加入预计应付。' },
        { name: this.storageFeeName, amount: f.storageFeeAmount, formula: this.form.ruleType === 'WANXIANG' ? '万翔结算销售单价已含基础仓储费，此处只加入人工录入额外仓储天数产生的费用。' : '按计费重量、仓储费率计算。' },
        { name: '系统预计应付', amount: f.expectedPaymentAmount, formula: expectedFormula }
      ]
    },
    feeRuleRows () {
      return [
        { name: '结算销售单价', formula: '确认函含税采购单价 + 基础加价 + 延期提货费率×延期天数 + 超期提货费率×超期天数。非万翔规则直接取确认函单价。' },
        { name: '系统还本', formula: '还本采购货值基数 × 贷款金额占确认函总金额比例；结果不能超过该贷款剩余本金。' },
        { name: '利息/资金成本', formula: '确认还本 × 本次年利率 ÷ 年基准天数 × 计息天数，仅作费用说明，不重复计入预计应付。' },
        { name: this.storageFeeName, formula: this.form.ruleType === 'WANXIANG' ? '计费重量KG ÷ 1000 × 仓储费率 × 额外仓储天数。' : '计费重量KG ÷ 1000 × 仓储费率。' },
        { name: '扫码费', formula: Number(this.form.includeCodeScanFee || 0) === 1 ? '按仓库费用历史维护的扫码计费方式和费率计算。' : '本次选择不计算扫码费。' },
        { name: '印花税', formula: '计费重量KG × 确认函含税单价 × 0.0006。' },
        { name: '保证金/押金', formula: '计费重量KG × 基础销售单价 × 25%，在预计应付金额中作为减项。' },
        { name: '补税点费用', formula: '按万翔税点等价系数及本次货值、仓储、扫码、印花税等金额自动计算。' },
        { name: '毛重费用', formula: '按报关单毛重分摊至产品和出库箱数，再结合毛重费率、计费天数计算。' },
        { name: '其他费用', formula: '用户人工补充金额，直接计入预计应付。' }
      ]
    },
    feeDetailRows () {
      const rows = []
      ;(this.form.itemList || []).forEach(item => {
        const base = {
          lineNo: item.lineNo,
          confirmContractNo: item.confirmContractNo,
          productCode: item.productCode,
          productName: item.productName,
          warehouseName: item.warehouseName
        }
        rows.push(Object.assign({}, base, { feeName: '结算销售单价', amount: item.settlementUnitPrice, unitPrice: true, formula: this.settlementPriceFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '货值金额', amount: item.costAmount, formula: `${this.weight(item.feeWeight)}KG × ${this.unitPrice(item.settlementUnitPrice)}元/KG = ${this.amount(item.costAmount)}` }))
        rows.push(Object.assign({}, base, { feeName: '系统还本', amount: item.systemPrincipalAmount, formula: this.principalFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '利息/资金成本', amount: item.interestAmount, formula: this.interestFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: this.storageFeeName, amount: item.storageFeeAmount, formula: this.storageFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '装卸费（说明项）', amount: item.handlingFeeAmount, formula: this.handlingFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '扫码费', amount: Number(this.form.includeCodeScanFee || 0) === 1 ? item.codeScanFeeAmount : 0, formula: this.codeScanFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '印花税', amount: item.stampTaxAmount, formula: `${this.weight(item.feeWeight)}KG × ${this.unitPrice(item.unitPriceInclTax)} × 0.0006 = ${this.amount(item.stampTaxAmount)}` }))
        rows.push(Object.assign({}, base, { feeName: '保证金/押金', amount: item.depositAmount, precise: true, formula: `${this.weight(item.feeWeight)}KG × 基础销售单价${this.unitPrice(item.baseSettlementUnitPrice || item.unitPriceInclTax)} × 25% = ${this.precise(item.depositAmount)}（减项）` }))
        rows.push(Object.assign({}, base, { feeName: '补税点费用', amount: item.taxAdjustAmount, formula: `系统按万翔税点等价规则计算 = ${this.amount(item.taxAdjustAmount)}` }))
        rows.push(Object.assign({}, base, { feeName: '毛重费用', amount: item.grossWeightFeeAmount, formula: this.grossWeightFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '本行预计应付', amount: item.expectedPaymentAmount, formula: this.expectedFormula(item) }))
      })
      return rows
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    dateOnly (value) {
      if (!value) return '-'
      return String(value).slice(0, 10)
    },
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
    precise (value) { return Number(value || 0).toFixed(11) },
    weight (value) { return Number(value || 0).toFixed(11) },
    unitPrice (value) { return Number(value || 0).toFixed(6) },
    feeAmount (row) {
      if (row && row.unitPrice) return this.unitPrice(row.amount)
      if (row && row.precise) return this.precise(row.amount)
      return this.amount(row && row.amount)
    },
    ruleName (value) {
      return ({ RUIHEXIANG: '瑞和祥', CHAOYUE: '超跃', WANXIANG: '万翔', DEFAULT: '默认资方' })[value] || value || '-'
    },
    settlementPriceFormula (item) {
      const purchase = this.unitPrice(item.unitPriceInclTax)
      if (this.form.ruleType !== 'WANXIANG') return `非万翔规则：直接取确认函含税单价 ${purchase}`
      const base = this.unitPrice(item.baseSettlementUnitPrice || item.unitPriceInclTax)
      const extensionRate = this.unitPrice(item.extensionPickupFeeRate)
      const overdueRate = this.unitPrice(item.overduePickupFeeRate)
      const extensionDays = Number(item.extensionPickupDays || 0)
      const overdueDays = Number(item.overduePickupDays || 0)
      const latest = item.latestPickupDate ? `；最迟提货日${item.latestPickupDate}` : ''
      return `基础销售单价${base} + 延期费率${extensionRate}×${extensionDays}天 + 超期费率${overdueRate}×${overdueDays}天 = ${this.unitPrice(item.settlementUnitPrice)}${latest}`
    },
    principalFormula (item) {
      const basis = Number(item.principalBasisAmount || 0)
      const ratio = Number(item.loanAllocationRatio || 0)
      if (!basis || !ratio) return `按确认函采购货值和贷款占比计算，结果为 ${this.amount(item.systemPrincipalAmount)}`
      return `采购货值基数${this.precise(basis)} × 贷款分摊比例${(ratio * 100).toFixed(8)}% = ${this.amount(item.systemPrincipalAmount)}`
    },
    interestFormula (item) {
      const rate = Number(item.annualInterestRate || 0)
      const daysBase = Number(item.interestDaysBase || (this.form.ruleType === 'WANXIANG' || this.form.ruleType === 'CHAOYUE' ? 360 : 365))
      return `确认还本${this.amount(item.confirmedPrincipalAmount)} × 年利率${(rate * 100).toFixed(6)}% ÷ ${daysBase} × ${Number(item.loanDays || 0)}天 = ${this.amount(item.interestAmount)}（说明项，不重复计入应付）`
    },
    tonRate (amount, weight, days) {
      const ton = Number(weight || 0) / 1000
      const divisor = ton * Math.max(Number(days || 1), 1)
      return divisor > 0 ? Number(amount || 0) / divisor : 0
    },
    storageFormula (item) {
      const days = Number(item.extraStorageDays || this.form.extraStorageDays || 0)
      const rate = Number(item.storageFeeRate || 0) || this.tonRate(item.storageFeeAmount, item.feeWeight, this.form.ruleType === 'WANXIANG' ? days : 1)
      const rateSource = `${item.warehouseName || '未维护仓库'}${item.warehouseRateEffectiveDate ? `（费率生效日${item.warehouseRateEffectiveDate}）` : ''}`
      if (this.form.ruleType === 'WANXIANG') return `${rateSource}：${this.weight(item.feeWeight)}KG ÷ 1000 × ${this.amount(rate)}元/吨/天 × ${days}天 = ${this.amount(item.storageFeeAmount)}`
      return `${rateSource}：${this.weight(item.feeWeight)}KG ÷ 1000 × ${this.amount(rate)}元/吨 = ${this.amount(item.storageFeeAmount)}`
    },
    handlingFormula (item) {
      const rate = Number(item.handlingFeeRate || 0) || this.tonRate(item.handlingFeeAmount, item.feeWeight, 1)
      const rateSource = `${item.warehouseName || '未维护仓库'}${item.warehouseRateEffectiveDate ? `（费率生效日${item.warehouseRateEffectiveDate}）` : ''}`
      return `${rateSource}：${this.weight(item.feeWeight)}KG ÷ 1000 × ${this.amount(rate)}元/吨 = ${this.amount(item.handlingFeeAmount)}（说明项，不重复计入应付）`
    },
    codeScanFormula (item) {
      if (Number(this.form.includeCodeScanFee || 0) !== 1) return '本次不计算扫码费，金额为0。'
      const boxes = Number(item.shippedBoxes || 0)
      const amount = Number(item.codeScanFeeAmount || 0)
      if (boxes > 0) return `${boxes}箱，按仓库扫码规则计算 = ${this.amount(amount)}`
      return `按仓库扫码规则计算 = ${this.amount(amount)}`
    },
    grossWeightFormula (item) {
      if (!Number(item.grossWeightFeeAmount || 0)) return '本行未产生毛重费用。'
      return `计费毛重${this.weight(item.grossDiffWeight)}KG ÷ 1000 × 费率${this.precise(item.grossFeeRate)} × ${Number(item.grossFeeDays || 0)}天 = ${this.amount(item.grossWeightFeeAmount)}`
    },
    expectedFormula (item) {
      return `货值${this.amount(item.costAmount)} + ${this.storageFeeName}${this.amount(item.storageFeeAmount)} + 扫码费${this.amount(Number(this.form.includeCodeScanFee || 0) === 1 ? item.codeScanFeeAmount : 0)} + 印花税${this.amount(item.stampTaxAmount)} - 保证金${this.precise(item.depositAmount)} + 补税点${this.amount(item.taxAdjustAmount)} + 毛重费${this.amount(item.grossWeightFeeAmount)} + 其他费用${this.amount(item.otherFeeAmount)} = ${this.amount(item.expectedPaymentAmount)}`
    }
  }
}
</script>

<style scoped>
.query-form { margin-bottom: 4px; }
.section-title { margin: 16px 0 10px; padding-left: 9px; border-left: 3px solid #168b80; font-weight: 700; }
.formula-alert { margin-bottom: 10px; }
.formula-collapse { margin-bottom: 14px; }
.fee-summary-card { margin: 0 0 18px 150px; border: 1px solid #e4e7ed; border-radius: 4px; background: #fafafa; }
.fee-summary-head { display: flex; align-items: center; justify-content: space-between; padding: 7px 14px; border-bottom: 1px solid #e4e7ed; font-weight: 700; }
.fee-summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
.fee-summary-item { padding: 12px 16px; border-right: 1px solid #e4e7ed; }
.fee-summary-item:last-child { border-right: 0; }
.fee-summary-item span { display: block; margin-bottom: 6px; color: #606266; font-size: 13px; }
.fee-summary-item strong { color: #168b80; font-size: 17px; }
.settlement-price-icon { margin-left: 5px; color: #168b80; cursor: pointer; }
.amount-difference, .difference-tip { color: #f04444; font-weight: 600; }
.difference-tip { margin: -5px 0 8px 120px; font-size: 12px; }
.reconciliation-dialog-body { display: flex; flex-direction: column; height: 72vh; min-height: 520px; overflow: hidden; }
.reconciliation-scroll-area { flex: 1; min-height: 0; overflow-y: auto; padding-right: 4px; }
.reconciliation-dock { flex: 0 0 auto; padding: 0 12px 2px; border-top: 1px solid #dfe6e4; background: #fff; box-shadow: 0 -5px 12px rgba(24, 65, 58, 0.08); }
.reconciliation-dock .section-title { margin-top: 10px; }
.reconciliation-dock .el-form-item { margin-bottom: 8px; }
.confirmed-statement-bar { display: flex; align-items: center; gap: 18px; min-height: 38px; padding-top: 5px; color: #606266; }
.confirmed-statement-bar strong { color: #303133; }
@media (max-width: 900px) {
  .fee-summary-grid { grid-template-columns: 1fr; }
  .fee-summary-card { margin-left: 0; }
  .confirmed-statement-bar { align-items: flex-start; flex-direction: column; gap: 2px; }
}
</style>
