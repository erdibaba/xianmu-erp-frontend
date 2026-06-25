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
      <el-form-item>
        <el-button v-if="isAuth('erp:funderloan:update')" type="success" @click="openBatchSettlement">按出库批次还款</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="loanNo" label="贷款编号" min-width="190"></el-table-column>
      <el-table-column label="还款状态" width="100" align="center">
        <template slot-scope="scope"><el-tag :type="scope.row.status === 1 ? 'success' : 'warning'" size="small">{{ scope.row.status === 1 ? '还款完成' : '待还款' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="170"></el-table-column>
      <el-table-column prop="sellerContractNo" label="预售合同号" min-width="160"></el-table-column>
      <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="160"></el-table-column>
      <el-table-column prop="loanDate" label="首次打款日期" width="120" align="center"></el-table-column>
      <el-table-column label="贷款本金" width="140" align="right"><template slot-scope="scope">{{ money(scope.row.loanAmount) }}</template></el-table-column>
      <el-table-column label="年利率（%）" width="150" align="right"><template slot-scope="scope">{{ rate(scope.row.annualInterestRate) }}</template></el-table-column>
      <el-table-column label="已还本金" width="140" align="right"><template slot-scope="scope">{{ money(scope.row.repaidPrincipal) }}</template></el-table-column>
      <el-table-column label="剩余本金" width="140" align="right"><template slot-scope="scope"><strong>{{ money(scope.row.remainingPrincipal) }}</strong></template></el-table-column>
      <el-table-column label="累计利息" width="180" align="right"><template slot-scope="scope">{{ decimal10(scope.row.interestAmount) }}</template></el-table-column>
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
        <el-descriptions-item label="预售合同号">{{ detailData.sellerContractNo }}</el-descriptions-item>
        <el-descriptions-item label="确认函合同号">{{ detailData.confirmContractNo }}</el-descriptions-item>
        <el-descriptions-item label="贷款本金">{{ money(detailData.loanAmount) }}</el-descriptions-item>
        <el-descriptions-item label="年利率">{{ rate(detailData.annualInterestRate) }}%</el-descriptions-item>
        <el-descriptions-item label="已还本金">{{ money(detailData.repaidPrincipal) }}</el-descriptions-item>
        <el-descriptions-item label="剩余本金">{{ money(detailData.remainingPrincipal) }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailData.repaymentList || []" border style="margin-top:16px" max-height="420">
        <el-table-column prop="lineNo" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="repaymentNo" label="还款编号" min-width="190"></el-table-column>
        <el-table-column prop="repaymentSource" label="来源" width="100">
          <template slot-scope="scope">{{ scope.row.repaymentSource === 'BATCH' ? '出库批次' : '手工' }}</template>
        </el-table-column>
        <el-table-column prop="outboundBatchNo" label="出库批次" min-width="140"></el-table-column>
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

    <el-dialog title="按出库批次还款" :visible.sync="batchSettlementVisible" width="1280px" custom-class="batch-settlement-dialog" :close-on-click-modal="false">
      <div v-loading="batchSettlementLoading" element-loading-text="正在加载批次还款数据...">
        <el-alert
          title="仅能选择已确认完成且未结算过的出库批次。系统会按出库批次实际出库重量追溯到客户订单确认函小合同，再按资方规则计算并分摊还款。"
          type="info"
          :closable="false"
          style="margin-bottom:16px">
        </el-alert>
        <el-form ref="batchSettlementForm" :model="batchSettlementForm" label-width="150px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="出库批次" required>
              <el-select
                v-model="batchSettlementForm.outboundBatchId"
                filterable
                remote
                reserve-keyword
                clearable
                placeholder="输入批次号/销售单号/货权搜索"
                :remote-method="searchBatchOptions"
                :loading="batchOptionLoading"
                style="width:100%"
                @change="batchSettlementBatchChange">
                <el-option
                  v-for="item in batchOptions"
                  :key="item.id"
                  :label="`${item.batchNo} / ${item.saleOrderNo || '-'} / ${item.ownershipName || '-'}`"
                  :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="结算日期" required>
              <el-date-picker v-model="batchSettlementForm.settlementDate" type="date" value-format="yyyy-MM-dd" style="width:100%" @change="calculateBatchSettlement"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6"><el-form-item label="资方规则"><el-input :value="ruleName(batchSettlementForm.ruleType)" disabled></el-input></el-form-item></el-col>
          <el-col :span="6">
            <el-form-item label="计算扫码费">
              <el-switch
                v-model="batchSettlementForm.includeCodeScanFee"
                :active-value="1"
                :inactive-value="0"
                active-text="计算"
                inactive-text="不计算"
                @change="calculateBatchSettlement">
              </el-switch>
            </el-form-item>
          </el-col>
          <el-col v-if="batchSettlementForm.ruleType === 'CHAOYUE'" :span="8">
            <el-form-item label="资方认定回款本金">
              <el-input-number v-model="batchSettlementForm.confirmedPrincipalAmount" :min="0" :precision="2" :controls="false" style="width:100%" @change="calculateBatchSettlement"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col v-if="batchSettlementForm.ruleType === 'WANXIANG'" :span="8">
            <el-form-item label="补税点费用">
              <el-input-number v-model="batchSettlementForm.taxAdjustAmount" :min="0" :precision="2" :controls="false" style="width:100%" @change="calculateBatchSettlement"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col v-if="batchSettlementForm.ruleType === 'WANXIANG'" :span="8">
            <el-form-item label="毛重费用">
              <el-input-number v-model="batchSettlementForm.grossWeightFeeAmount" :min="0" :precision="2" :controls="false" style="width:100%" @change="calculateBatchSettlement"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="其他费用">
              <el-input-number v-model="batchSettlementForm.otherFeeAmount" :min="0" :precision="2" :controls="false" style="width:100%" @change="calculateBatchSettlement"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="系统还本"><el-input :value="money(batchSettlementForm.systemPrincipalAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="确认还本"><el-input :value="money(batchSettlementForm.confirmedPrincipalAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="24">
            <div class="fee-summary-card">
              <div class="fee-summary-head">
                <span>费用说明</span>
                <el-button type="text" icon="el-icon-question" @click="otherFeeDetailVisible = true">查看计算明细</el-button>
              </div>
              <div class="fee-summary-grid">
                <div class="fee-summary-item">
                  <span>利息/资金成本</span>
                  <strong>¥{{ money(batchSettlementForm.interestAmount) }}</strong>
                </div>
                <div class="fee-summary-item">
                  <span>仓储费用</span>
                  <strong>¥{{ money(batchSettlementForm.storageFeeAmount) }}</strong>
                </div>
                <div class="fee-summary-item">
                  <span>其他资方费用</span>
                  <strong>¥{{ money(otherBatchFees) }}</strong>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="8"><el-form-item label="系统预计应付"><el-input :value="money(batchSettlementForm.expectedPaymentAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="8">
            <el-form-item label="资方还款凭证" required>
              <el-upload action="#" :show-file-list="false" :http-request="recognizeBatchVoucher" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="primary" plain :loading="batchRecognizeLoading">上传并识别凭证</el-button>
              </el-upload>
              <span class="file-name">{{ batchSettlementForm.fileName || '尚未上传' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8"><el-form-item label="识别金额"><el-input :value="money(batchSettlementForm.recognizedPaymentAmount)" disabled></el-input></el-form-item></el-col>
          <el-col :span="8">
            <el-form-item label="确认应付金额" required>
              <el-input-number v-model="batchSettlementForm.confirmedPaymentAmount" :min="0" :precision="2" :controls="false" style="width:100%"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="batchSettlementForm.remark" maxlength="500"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        </el-form>
        <el-table class="batch-settlement-item-table" :data="batchSettlementForm.itemList || []" border stripe height="460">
          <el-table-column prop="lineNo" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="100"></el-table-column>
          <el-table-column prop="productName" label="品名" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="90"></el-table-column>
          <el-table-column label="出库箱数" width="90" align="right"><template slot-scope="scope">{{ scope.row.shippedBoxes || 0 }}</template></el-table-column>
          <el-table-column label="计费重量KG" width="120" align="right"><template slot-scope="scope">{{ number3(scope.row.feeWeight || scope.row.shippedWeight) }}</template></el-table-column>
          <el-table-column label="确认函单价" width="110" align="right"><template slot-scope="scope">{{ number6(scope.row.unitPriceInclTax) }}</template></el-table-column>
          <el-table-column label="系统还本" width="120" align="right"><template slot-scope="scope">{{ money(scope.row.systemPrincipalAmount) }}</template></el-table-column>
          <el-table-column label="确认还本" width="120" align="right"><template slot-scope="scope">{{ money(scope.row.confirmedPrincipalAmount) }}</template></el-table-column>
          <el-table-column prop="loanDays" label="计息天数" width="90" align="right"></el-table-column>
          <el-table-column label="利息/资金成本" width="130" align="right"><template slot-scope="scope">{{ money(scope.row.interestAmount) }}</template></el-table-column>
          <el-table-column label="预计应付" width="120" align="right"><template slot-scope="scope">{{ money(scope.row.expectedPaymentAmount) }}</template></el-table-column>
        </el-table>
      </div>
      <span slot="footer">
        <el-button @click="batchSettlementVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitLoading" @click="confirmBatchSettlement">确认批次还款</el-button>
      </span>
    </el-dialog>

    <el-dialog title="费用计算说明" :visible.sync="otherFeeDetailVisible" width="1180px" append-to-body>
      <el-alert
        :title="batchFeeRuleText"
        type="info"
        :closable="false"
        style="margin-bottom:12px">
      </el-alert>
      <el-collapse v-model="feeExplainActiveNames">
        <el-collapse-item title="费用汇总" name="summary">
          <el-table :data="batchFeeSummaryRows" border stripe size="mini">
            <el-table-column prop="name" label="费用大类" width="150"></el-table-column>
            <el-table-column label="金额" width="130" align="right">
              <template slot-scope="scope">{{ money(scope.row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="formula" label="汇总公式" min-width="520" show-overflow-tooltip></el-table-column>
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="费用项公式" name="formula">
          <el-table :data="batchFeeFormulaRows" border stripe size="mini">
            <el-table-column prop="name" label="费用项" width="130"></el-table-column>
            <el-table-column label="金额" width="120" align="right">
              <template slot-scope="scope">{{ money(scope.row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="formula" label="计算公式/来源" min-width="620" show-overflow-tooltip></el-table-column>
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="明细代入公式" name="detail">
          <el-table :data="batchFeeDetailRows" border stripe size="mini" max-height="360">
            <el-table-column prop="lineNo" label="行号" width="60" align="center"></el-table-column>
            <el-table-column prop="productCode" label="产品编码" width="100"></el-table-column>
            <el-table-column prop="productName" label="品名" min-width="150" show-overflow-tooltip></el-table-column>
            <el-table-column prop="containerNo" label="柜号" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="feeName" label="费用项" width="120"></el-table-column>
            <el-table-column label="金额" width="110" align="right">
              <template slot-scope="scope">{{ money(scope.row.amount) }}</template>
            </el-table-column>
            <el-table-column prop="formula" label="明细公式" min-width="520" show-overflow-tooltip></el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
      <div class="other-fee-total">费用合计：¥{{ money(batchFeeTotal) }}</div>
      <span slot="footer">
        <el-button @click="otherFeeDetailVisible = false">关闭</el-button>
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

const emptyBatchSettlement = () => ({
  outboundBatchId: '',
  settlementDate: new Date().toISOString().slice(0, 10),
  ruleType: '',
  systemPrincipalAmount: 0,
  confirmedPrincipalAmount: 0,
  interestAmount: 0,
  storageFeeAmount: 0,
  handlingFeeAmount: 0,
  codeScanFeeAmount: 0,
  stampTaxAmount: 0,
  depositAmount: 0,
  taxAdjustAmount: 0,
  grossWeightFeeAmount: 0,
  includeCodeScanFee: 0,
  otherFeeAmount: 0,
  expectedPaymentAmount: 0,
  recognizedPaymentAmount: 0,
  confirmedPaymentAmount: 0,
  filePath: '',
  fileName: '',
  rawText: '',
  remark: '',
  itemList: []
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
      batchSettlementVisible: false,
      batchSettlementForm: emptyBatchSettlement(),
      batchOptions: [],
      batchOptionLoading: false,
      batchSettlementLoading: false,
      batchSettlementCalcToken: 0,
      batchRecognizeLoading: false,
      batchSubmitLoading: false,
      otherFeeDetailVisible: false,
      feeExplainActiveNames: ['summary', 'formula'],
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
    },
    otherBatchFees () {
      const f = this.batchSettlementForm
      return Number(f.handlingFeeAmount || 0) + Number(this.effectiveCodeScanFee || 0) + Number(f.stampTaxAmount || 0) + Number(f.depositAmount || 0) + Number(f.taxAdjustAmount || 0) + Number(f.grossWeightFeeAmount || 0) + Number(f.otherFeeAmount || 0)
    },
    batchFeeTotal () {
      const f = this.batchSettlementForm
      return Number(f.interestAmount || 0) + Number(f.storageFeeAmount || 0) + Number(this.otherBatchFees || 0)
    },
    batchFeeSummaryRows () {
      const f = this.batchSettlementForm
      return [
        { name: '利息/资金成本', amount: f.interestAmount, formula: this.sumFormula('各明细行利息/资金成本', f.interestAmount) },
        { name: '仓储费用', amount: f.storageFeeAmount, formula: this.sumFormula('各明细行仓储费用', f.storageFeeAmount) },
        { name: '其他资方费用', amount: this.otherBatchFees, formula: `手续费${this.money(f.handlingFeeAmount)} + 扫码费${this.money(this.effectiveCodeScanFee)} + 印花税${this.money(f.stampTaxAmount)} + 保证金/押金${this.money(f.depositAmount)} + 补税点费用${this.money(f.taxAdjustAmount)} + 毛重费用${this.money(f.grossWeightFeeAmount)} + 其他费用${this.money(f.otherFeeAmount)} = ${this.money(this.otherBatchFees)}` }
      ]
    },
    batchFeeFormulaRows () {
      const f = this.batchSettlementForm
      return [
        { name: '利息/资金成本', amount: f.interestAmount, formula: this.interestRuleFormula() },
        { name: '仓储费用', amount: f.storageFeeAmount, formula: '各明细行按：出库重量KG ÷ 1000 × 仓储费单价（按仓库费用历史和业务日期取价）计算后汇总。' },
        { name: '手续费/装卸费', amount: f.handlingFeeAmount, formula: '各明细行按：出库重量KG ÷ 1000 × 装卸费单价（按仓库费用历史和业务日期取价）计算后汇总。' },
        { name: '扫码费', amount: this.effectiveCodeScanFee, formula: '开关打开时，各明细行按对应仓库费用历史维护的扫码费方式和单价计算；开关关闭时为0。' },
        { name: '印花税', amount: f.stampTaxAmount, formula: '各明细行按：出库重量KG × 确认函含税单价 × 0.0006 计算后汇总。' },
        { name: '保证金/押金', amount: f.depositAmount, formula: '各明细行按：货值金额 × 25%；货值金额 = 出库重量KG × 确认函含税单价。' },
        { name: '补税点费用', amount: f.taxAdjustAmount, formula: '人工录入费用，计入其他资方费用。' },
        { name: '毛重费用', amount: f.grossWeightFeeAmount, formula: '各明细行按：先用 产品总净重 ÷ 确认单整单净重 × 报关单确认毛重 得到产品总毛重，再按 产品总毛重 ÷ 产品总箱数 × 本次出库箱数 得到本次计费毛重，最后按 本次计费毛重KG ÷ 1000 × 毛重费率 × 计费天数 计算后汇总。' },
        { name: '其他费用', amount: f.otherFeeAmount, formula: '人工补充费用，计入其他资方费用。' }
      ]
    },
    batchFeeDetailRows () {
      const rows = []
      ;(this.batchSettlementForm.itemList || []).forEach(item => {
        const base = {
          lineNo: item.lineNo,
          productCode: item.productCode,
          productName: item.productName,
          containerNo: item.containerNo
        }
        rows.push(Object.assign({}, base, { feeName: '利息/资金成本', amount: item.interestAmount, formula: this.itemInterestFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '仓储费用', amount: item.storageFeeAmount, formula: this.itemStorageFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '手续费/装卸费', amount: item.handlingFeeAmount, formula: this.itemHandlingFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '扫码费', amount: this.isIncludeCodeScanFee ? item.codeScanFeeAmount : 0, formula: this.itemCodeScanFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '印花税', amount: item.stampTaxAmount, formula: this.itemStampTaxFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '保证金/押金', amount: item.depositAmount, formula: this.itemDepositFormula(item) }))
        rows.push(Object.assign({}, base, { feeName: '毛重费用', amount: item.grossWeightFeeAmount, formula: this.itemGrossWeightFormula(item) }))
      })
      return rows
    },
    batchFeeRuleText () {
      const rule = this.ruleName(this.batchSettlementForm.ruleType)
      return `当前资方规则：${rule}。本说明展示利息/资金成本、仓储费用、其他资方费用的计算来源；人工录入项会标记为人工录入。`
    },
    isIncludeCodeScanFee () {
      return Number(this.batchSettlementForm.includeCodeScanFee || 0) === 1
    },
    effectiveCodeScanFee () {
      return this.isIncludeCodeScanFee ? Number(this.batchSettlementForm.codeScanFeeAmount || 0) : 0
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    money (value) { return Number(value || 0).toFixed(2) },
    rate (value) { return Number(value || 0).toFixed(10) },
    decimal10 (value) { return Number(value || 0).toFixed(10) },
    number3 (value) { return Number(value || 0).toFixed(3) },
    number6 (value) { return Number(value || 0).toFixed(6) },
    sumFormula (name, amount) {
      return `${name}汇总 = ${this.money(amount)}`
    },
    ton (kg) {
      return Number(kg || 0) / 1000
    },
    inferTonRate (amount, kg) {
      const ton = this.ton(kg)
      return ton > 0 ? Number(amount || 0) / ton : 0
    },
    feeWeight (item) {
      return Number((item && (item.feeWeight || item.shippedWeight)) || 0)
    },
    interestRuleFormula () {
      const map = {
        RUIHEXIANG: '瑞和祥：各明细行按 确认还本 × 6% ÷ 365 × 计息天数 计算；跨月时计息天数按结算日所在月天数规则取值。',
        CHAOYUE: '超跃：各明细行按 确认还本 × 6.984% ÷ 360 × 计息天数 计算。',
        WANXIANG: '万翔：各明细行按 确认还本 × 5.5% ÷ 360 × 计息天数 计算。',
        DEFAULT: '默认：各明细行按 确认还本 × 资方维护年利率 ÷ 365 × 计息天数 计算。'
      }
      return map[this.batchSettlementForm.ruleType] || map.DEFAULT
    },
    itemInterestFormula (item) {
      const rule = this.batchSettlementForm.ruleType
      const rate = rule === 'RUIHEXIANG' ? '6%' : rule === 'CHAOYUE' ? '6.984%' : rule === 'WANXIANG' ? '5.5%' : '资方维护年利率'
      const daysBase = rule === 'CHAOYUE' || rule === 'WANXIANG' ? 360 : 365
      return `确认还本${this.money(item.confirmedPrincipalAmount)} × ${rate} ÷ ${daysBase} × ${item.loanDays || 0}天 = ${this.money(item.interestAmount)}`
    },
    itemStorageFormula (item) {
      const weight = this.feeWeight(item)
      const rate = this.inferTonRate(item.storageFeeAmount, weight)
      return `计费重量${this.number3(weight)}KG ÷ 1000 × 仓储费单价${this.money(rate)}元/吨 = ${this.money(item.storageFeeAmount)}`
    },
    itemHandlingFormula (item) {
      const weight = this.feeWeight(item)
      const rate = this.inferTonRate(item.handlingFeeAmount, weight)
      return `计费重量${this.number3(weight)}KG ÷ 1000 × 装卸费单价${this.money(rate)}元/吨 = ${this.money(item.handlingFeeAmount)}`
    },
    itemCodeScanFormula (item) {
      if (!this.isIncludeCodeScanFee) {
        return '当前选择不计算扫码费，扫码费按0计入。'
      }
      const boxes = Number(item.shippedBoxes || 0)
      const amount = Number(item.codeScanFeeAmount || 0)
      if (boxes > 0 && Math.abs(amount / boxes - 0.35) < 0.01) {
        return `出库箱数${boxes} × 0.35 = ${this.money(item.codeScanFeeAmount)}`
      }
      const weight = this.feeWeight(item)
      const rate = this.inferTonRate(item.codeScanFeeAmount, weight)
      return `计费重量${this.number3(weight)}KG ÷ 1000 × ${this.money(rate)}元/吨 = ${this.money(item.codeScanFeeAmount)}`
    },
    itemStampTaxFormula (item) {
      const weight = this.feeWeight(item)
      return `计费重量${this.number3(weight)}KG × 确认函含税单价${this.number6(item.unitPriceInclTax)} × 0.0006 = ${this.money(item.stampTaxAmount)}`
    },
    itemDepositFormula (item) {
      return `货值金额${this.money(item.costAmount)} × 25% = ${this.money(item.depositAmount)}`
    },
    itemGrossWeightFormula (item) {
      if (!Number(item.grossWeightFeeAmount || 0)) {
        return '当前明细未产生毛重费用。'
      }
      const grossWeight = Number(item.grossDiffWeight || 0)
      const rate = Number(item.grossFeeRate || 0)
      const days = Number(item.grossFeeDays || 0)
      return `本次计费毛重${this.number3(grossWeight)}KG ÷ 1000 × 毛重费率${this.money(rate)}元/吨/天 × ${days}天 = ${this.money(item.grossWeightFeeAmount)}。本次计费毛重由：产品总净重 ÷ 确认单整单净重 × 报关单确认毛重，再按本次出库箱数折算。`
    },
    ruleName (value) {
      const map = { RUIHEXIANG: '瑞和祥', CHAOYUE: '超跃', WANXIANG: '万翔', DEFAULT: '默认' }
      return map[value] || value || '-'
    },
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
    openBatchSettlement () {
      this.batchSettlementForm = emptyBatchSettlement()
      this.batchSettlementVisible = true
      this.batchSettlementLoading = true
      this.searchBatchOptions('').finally(() => {
        this.batchSettlementLoading = false
      })
    },
    searchBatchOptions (keyword) {
      this.batchOptionLoading = true
      return this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/batch-options'),
        method: 'get',
        params: this.$http.adornParams({ keyword })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.batchOptions = data.list || []
        } else {
          this.$message.error((data && data.msg) || '获取出库批次失败')
        }
      }).finally(() => {
        this.batchOptionLoading = false
      })
    },
    batchSettlementBatchChange () {
      this.calculateBatchSettlement()
    },
    calculateBatchSettlement () {
      if (!this.batchSettlementForm.outboundBatchId || !this.batchSettlementForm.settlementDate) return
      const requestIncludeCodeScanFee = Number(this.batchSettlementForm.includeCodeScanFee || 0)
      const calcToken = ++this.batchSettlementCalcToken
      const keepFile = {
        recognizedPaymentAmount: this.batchSettlementForm.recognizedPaymentAmount,
        confirmedPaymentAmount: this.batchSettlementForm.confirmedPaymentAmount,
        filePath: this.batchSettlementForm.filePath,
        fileName: this.batchSettlementForm.fileName,
        rawText: this.batchSettlementForm.rawText,
        remark: this.batchSettlementForm.remark
      }
      const requestForm = Object.assign({}, this.batchSettlementForm, {
        includeCodeScanFee: requestIncludeCodeScanFee
      })
      this.batchSettlementLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/batch-settlement/calculate'),
        method: 'post',
        data: this.$http.adornData(requestForm)
      }).then(({ data }) => {
        if (calcToken !== this.batchSettlementCalcToken) {
          return
        }
        if (data && data.code === 0) {
          this.batchSettlementForm = Object.assign(emptyBatchSettlement(), data.settlement || {}, keepFile)
          this.batchSettlementForm.includeCodeScanFee = requestIncludeCodeScanFee
          if (!Number(this.batchSettlementForm.confirmedPaymentAmount || 0)) {
            this.batchSettlementForm.confirmedPaymentAmount = this.batchSettlementForm.expectedPaymentAmount || 0
          }
        } else {
          this.$message.error((data && data.msg) || '计算批次结算失败')
        }
      }).catch(() => {
        this.$message.error('计算批次结算请求失败')
      }).finally(() => {
        if (calcToken === this.batchSettlementCalcToken) {
          this.batchSettlementLoading = false
        }
      })
    },
    recognizeBatchVoucher (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.batchRecognizeLoading = true
      const loading = this.$loading({ lock: true, text: '正在识别并归档资方还款凭证...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          this.batchSettlementForm.recognizedPaymentAmount = Number(voucher.recognizedAmount || 0)
          this.batchSettlementForm.confirmedPaymentAmount = Number(voucher.recognizedAmount || 0)
          this.batchSettlementForm.settlementDate = voucher.paymentDate || this.batchSettlementForm.settlementDate
          this.batchSettlementForm.filePath = voucher.filePath || ''
          this.batchSettlementForm.fileName = voucher.fileName || request.file.name
          this.batchSettlementForm.rawText = voucher.rawText || ''
          this.calculateBatchSettlement()
          this.$message.success('资方还款凭证识别完成，请核对金额和日期')
        } else {
          this.$message.error((data && data.msg) || '资方还款凭证识别失败')
        }
      }).catch(() => this.$message.error('资方还款凭证识别请求失败')).finally(() => {
        this.batchRecognizeLoading = false
        loading.close()
      })
    },
    confirmBatchSettlement () {
      if (!this.batchSettlementForm.outboundBatchId) {
        this.$message.error('请选择出库批次')
        return
      }
      if (!this.batchSettlementForm.filePath) {
        this.$message.error('请先上传资方还款凭证')
        return
      }
      if (Number(this.batchSettlementForm.confirmedPaymentAmount || 0) <= 0) {
        this.$message.error('确认应付金额必须大于0')
        return
      }
      this.batchSubmitLoading = true
      const loading = this.$loading({ lock: true, text: '正在确认批次还款...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/loan/batch-settlement/confirm'),
        method: 'post',
        data: this.$http.adornData(this.batchSettlementForm)
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('批次还款已确认')
          this.batchSettlementVisible = false
          this.getDataList()
        } else {
          this.$message.error((data && data.msg) || '确认批次还款失败')
        }
      }).catch(() => this.$message.error('确认批次还款请求失败')).finally(() => {
        this.batchSubmitLoading = false
        loading.close()
      })
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
.fee-explain-field { display: flex; align-items: center; gap: 8px; }
.fee-explain-field .el-input { flex: 1; }
.fee-summary-card { border: 1px solid #dcdfe6; border-radius: 6px; padding: 12px 14px; margin-bottom: 18px; background: #fbfdff; }
.fee-summary-head { display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: #303133; margin-bottom: 10px; }
.fee-summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.fee-summary-item { border: 1px solid #ebeef5; border-radius: 4px; padding: 10px 12px; background: #fff; display: flex; align-items: center; justify-content: space-between; color: #606266; }
.fee-summary-item strong { color: #17b3a3; font-size: 16px; }
.other-fee-total { margin-top: 10px; text-align: right; font-weight: 700; color: #303133; }
/deep/ .batch-settlement-dialog .el-dialog__body { max-height: calc(100vh - 190px); overflow-y: auto; padding-bottom: 12px; }
.batch-settlement-item-table { margin-top: 4px; }
</style>
