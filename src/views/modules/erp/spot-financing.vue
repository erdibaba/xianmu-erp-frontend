<template>
  <div class="mod-spot-financing">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="融资单号/确认函合同号/资方" @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.status" clearable placeholder="融资状态" @change="getDataList()">
          <el-option label="融资生效" :value="1"></el-option>
          <el-option label="贷款结清" :value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:spotfinance:save')" type="success" @click="openCreate">新增现货融资</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="financingNo" label="融资单号" min-width="190"></el-table-column>
      <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="160"></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="190" show-overflow-tooltip></el-table-column>
      <el-table-column prop="paymentDate" label="来款日期" width="120" align="center"></el-table-column>
      <el-table-column label="库存货值参考" width="150" align="right"><template slot-scope="scope">{{ money(scope.row.referenceStockValue) }}</template></el-table-column>
      <el-table-column label="融资本金" width="150" align="right"><template slot-scope="scope"><strong>{{ money(scope.row.modifiedAmount) }}</strong></template></el-table-column>
      <el-table-column label="货值核对" width="105" align="center">
        <template slot-scope="scope"><el-tag :type="scope.row.overReferenceFlag === 1 ? 'danger' : 'success'" size="small">{{ scope.row.overReferenceFlag === 1 ? '超过参考' : '未超过' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="loanNo" label="贷款编号" min-width="185"></el-table-column>
      <el-table-column label="剩余本金" width="145" align="right"><template slot-scope="scope">{{ money(scope.row.remainingPrincipal) }}</template></el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope"><el-tag :type="scope.row.status === 2 ? 'info' : 'warning'" size="small">{{ scope.row.status === 2 ? '贷款结清' : '融资生效' }}</el-tag></template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="165" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row.id)">详情</el-button>
          <el-button type="text" size="small" @click="previewVoucher(scope.row.id)">预览水单</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      :current-page="pageIndex" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper" @size-change="sizeChangeHandle" @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog title="新增现货融资" :visible.sync="createVisible" width="1280px" top="5vh" :close-on-click-modal="false">
      <el-alert
        title="仅可选择鲜牧货权的现货。已被销售单锁定但尚未进入出库批次的库存也允许融资；已进入出库批次的库存不会进入候选范围。"
        type="info" :closable="false" style="margin-bottom:16px">
      </el-alert>
      <el-form ref="financeForm" :model="financeForm" :rules="financeRules" label-width="120px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="确认函合同" prop="confirmId">
              <el-select v-model="financeForm.confirmId" filterable remote clearable :remote-method="searchContracts" :loading="contractLoading" placeholder="输入合同号、柜号或采购方搜索" style="width:100%" @change="confirmChange">
                <el-option v-for="item in contractOptions" :key="item.id" :value="item.id" :label="contractLabel(item)"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="融资资方" prop="funderId">
              <el-select v-model="financeForm.funderId" filterable remote clearable :remote-method="searchFunders" :loading="funderLoading" placeholder="输入资方编码或名称搜索" style="width:100%">
                <el-option v-for="item in funderOptions" :key="item.id" :value="item.id" :label="item.partnerName">
                  <span>{{ item.partnerName }}</span><span class="option-extra">{{ item.partnerCode || '' }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来款日期" prop="paymentDate"><el-date-picker v-model="financeForm.paymentDate" type="date" value-format="yyyy-MM-dd" style="width:100%"></el-date-picker></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="确认融资本金" prop="modifiedAmount"><el-input-number v-model="financeForm.modifiedAmount" :min="0" :precision="2" :controls="false" style="width:100%"></el-input-number></el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="资方来款水单" prop="filePath">
              <el-upload action="#" :show-file-list="false" :http-request="recognizeVoucher" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="primary" plain :loading="recognizeLoading">上传并识别水单</el-button>
              </el-upload>
              <span class="file-name">{{ financeForm.fileName || '尚未上传' }}</span>
              <div class="support-tip">支持浦发银行、建设银行、工商银行、兴业银行、农业发展银行、中国银行样本。</div>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-head">
          <strong>选择融资库存</strong>
          <el-input v-model="candidateKeyword" clearable size="small" placeholder="产品编码/市场流通名称" style="width:240px" @keyup.enter.native="loadCandidates"></el-input>
          <el-button size="small" type="primary" @click="loadCandidates">查询库存</el-button>
          <span>已选 {{ selectedRows.length }} 条，{{ selectedBoxes }} 箱，参考货值 {{ money(selectedReferenceAmount) }}</span>
        </div>
        <el-table ref="candidateTable" :data="candidateList" border height="330" v-loading="candidateLoading" @selection-change="selectionChange">
          <el-table-column type="selection" width="46" :selectable="rowSelectable"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="105"></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="170" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.marketCirculationName || scope.row.productName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="145" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" width="135" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="85"></el-table-column>
          <el-table-column prop="productionDate" label="生产日期" width="110"></el-table-column>
          <el-table-column prop="expiryDate" label="过期日期" width="110"></el-table-column>
          <el-table-column prop="unlockedBoxes" label="未占用箱数" width="105" align="right"></el-table-column>
          <el-table-column prop="saleLockedBoxes" label="销售锁定箱数" width="120" align="right"></el-table-column>
          <el-table-column prop="availableBoxes" label="可融资箱数" width="105" align="right"></el-table-column>
          <el-table-column label="本次融资箱数" width="145">
            <template slot-scope="scope"><el-input-number v-model="scope.row.financingBoxes" :min="1" :max="scope.row.availableBoxes" :precision="0" :controls="false" size="small" style="width:115px"></el-input-number></template>
          </el-table-column>
          <el-table-column label="预计重量KG" width="125" align="right"><template slot-scope="scope">{{ quantity(rowWeight(scope.row)) }}</template></el-table-column>
          <el-table-column label="含税采购单价" width="125" align="right"><template slot-scope="scope">{{ price(scope.row.purchaseUnitPrice) }}</template></el-table-column>
          <el-table-column label="参考货值" width="130" align="right"><template slot-scope="scope">{{ money(rowReference(scope.row)) }}</template></el-table-column>
        </el-table>
        <div v-if="isOverReference" class="amount-warning">确认融资本金超过所选库存采购货值 {{ money(selectedReferenceAmount) }}，请核对；系统允许继续确认并保留超额标记。</div>
        <el-form-item label="备注" style="margin-top:16px"><el-input v-model="financeForm.remark" maxlength="500" show-word-limit></el-input></el-form-item>
      </el-form>
      <span slot="footer"><el-button @click="createVisible=false">取消</el-button><el-button type="primary" :loading="submitLoading" @click="submitFinance">确认融资</el-button></span>
    </el-dialog>

    <el-dialog title="现货融资详情" :visible.sync="detailVisible" width="1200px" top="7vh">
      <el-descriptions v-if="detailData.id" :column="4" border>
        <el-descriptions-item label="融资单号">{{ detailData.financingNo }}</el-descriptions-item>
        <el-descriptions-item label="确认函合同号">{{ detailData.confirmContractNo }}</el-descriptions-item>
        <el-descriptions-item label="融资资方">{{ detailData.funderName }}</el-descriptions-item>
        <el-descriptions-item label="来款日期">{{ detailData.paymentDate }}</el-descriptions-item>
        <el-descriptions-item label="库存货值参考">{{ money(detailData.referenceStockValue) }}</el-descriptions-item>
        <el-descriptions-item label="OCR识别金额">{{ money(detailData.recognizedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="确认融资本金">{{ money(detailData.modifiedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="贷款编号">{{ detailData.loanNo || '-' }}</el-descriptions-item>
      </el-descriptions>
      <el-alert v-if="detailData.overReferenceFlag === 1" title="确认融资本金超过所选库存采购货值，确认时已按业务要求允许通过。" type="error" :closable="false" style="margin:16px 0"></el-alert>
      <el-table :data="detailData.itemList || []" border height="360" style="margin-top:16px">
        <el-table-column prop="lineNo" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="105"></el-table-column>
        <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="warehouseName" label="仓库" min-width="150"></el-table-column>
        <el-table-column prop="containerNo" label="柜号" width="135"></el-table-column>
        <el-table-column prop="factoryNo" label="厂号" width="85"></el-table-column>
        <el-table-column prop="productionDate" label="生产日期" width="110"></el-table-column>
        <el-table-column prop="expiryDate" label="过期日期" width="110"></el-table-column>
        <el-table-column prop="financingBoxes" label="融资箱数" width="100" align="right"></el-table-column>
        <el-table-column label="预计重量KG" width="125" align="right"><template slot-scope="scope">{{ quantity(scope.row.financingWeightKg) }}</template></el-table-column>
        <el-table-column label="含税采购单价" width="125" align="right"><template slot-scope="scope">{{ price(scope.row.purchaseUnitPrice) }}</template></el-table-column>
        <el-table-column label="参考货值" width="130" align="right"><template slot-scope="scope">{{ money(scope.row.referenceAmount) }}</template></el-table-column>
      </el-table>
      <span slot="footer"><el-button type="primary" plain @click="previewVoucher(detailData.id)">预览来款水单</el-button><el-button @click="detailVisible=false">关闭</el-button></span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      queryForm: { keyword: '', status: '' },
      dataList: [],
      dataListLoading: false,
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      createVisible: false,
      detailVisible: false,
      detailData: {},
      submitLoading: false,
      contractOptions: [],
      contractLoading: false,
      funderOptions: [],
      funderLoading: false,
      candidateList: [],
      candidateLoading: false,
      candidateKeyword: '',
      selectedRows: [],
      recognizeLoading: false,
      financeForm: this.emptyForm(),
      financeRules: {
        confirmId: [{ required: true, message: '请选择确认函合同', trigger: 'change' }],
        funderId: [{ required: true, message: '请选择融资资方', trigger: 'change' }],
        paymentDate: [{ required: true, message: '请选择来款日期', trigger: 'change' }],
        modifiedAmount: [{ required: true, validator: (r, v, cb) => Number(v) > 0 ? cb() : cb(new Error('确认融资本金必须大于0')), trigger: 'blur' }],
        filePath: [{ required: true, message: '请上传并识别资方来款水单', trigger: 'change' }]
      }
    }
  },
  computed: {
    selectedBoxes () { return this.selectedRows.reduce((sum, row) => sum + Number(row.financingBoxes || 0), 0) },
    selectedReferenceAmount () { return this.selectedRows.reduce((sum, row) => sum + this.rowReference(row), 0) },
    isOverReference () { return Number(this.financeForm.modifiedAmount || 0) > Number(this.selectedReferenceAmount || 0) && this.selectedRows.length > 0 }
  },
  activated () { this.getDataList() },
  methods: {
    emptyForm () { return { confirmId: null, funderId: null, paymentDate: '', recognizedAmount: 0, modifiedAmount: 0, filePath: '', fileName: '', rawText: '', payerNameRecognized: '', payerNameModified: '', payeeNameRecognized: '', payeeNameModified: '', serialNoRecognized: '', serialNoModified: '', remark: '', itemList: [] } },
    getDataList () {
      this.dataListLoading = true
      this.$http({ url: this.$http.adornUrl('/erp/spot-financing/list'), method: 'get', params: this.$http.adornParams({ page: this.pageIndex, limit: this.pageSize, ...this.queryForm }) }).then(({ data }) => {
        if (data && data.code === 0) { this.dataList = data.page.list || []; this.totalPage = data.page.totalCount || 0 } else { this.dataList = []; this.totalPage = 0; this.$message.error(data.msg || '查询失败') }
      }).finally(() => { this.dataListLoading = false })
    },
    sizeChangeHandle (val) { this.pageSize = val; this.pageIndex = 1; this.getDataList() },
    currentChangeHandle (val) { this.pageIndex = val; this.getDataList() },
    openCreate () { this.financeForm = this.emptyForm(); this.candidateList = []; this.selectedRows = []; this.candidateKeyword = ''; this.createVisible = true; this.searchContracts(''); this.searchFunders('') },
    searchContracts (keyword) {
      this.contractLoading = true
      this.$http({ url: this.$http.adornUrl('/erp/spot-financing/contract-options'), method: 'get', params: this.$http.adornParams({ keyword }, false) }).then(({ data }) => { this.contractOptions = data && data.code === 0 ? (data.list || []) : [] }).finally(() => { this.contractLoading = false })
    },
    searchFunders (keyword) {
      this.funderLoading = true
      this.$http({ url: this.$http.adornUrl('/erp/funder-finance/funder-options'), method: 'get', params: this.$http.adornParams({ keyword }, false) }).then(({ data }) => { this.funderOptions = data && data.code === 0 ? (data.list || []) : [] }).finally(() => { this.funderLoading = false })
    },
    contractLabel (item) { return `${item.contractNo || '-'} / ${item.containerNo || '-'} / ${item.buyerPartnerName || '-'}` },
    confirmChange () { this.selectedRows = []; this.loadCandidates() },
    loadCandidates () {
      if (!this.financeForm.confirmId) { this.candidateList = []; return }
      this.candidateLoading = true
      this.$http({ url: this.$http.adornUrl('/erp/spot-financing/candidates'), method: 'get', params: this.$http.adornParams({ confirmId: this.financeForm.confirmId, keyword: this.candidateKeyword }, false) }).then(({ data }) => {
        this.candidateList = data && data.code === 0 ? (data.list || []).map(row => ({ ...row, financingBoxes: row.availableBoxes })) : []
      }).finally(() => { this.candidateLoading = false })
    },
    selectionChange (rows) { this.selectedRows = rows },
    rowSelectable (row) { return Number(row.availableBoxes || 0) > 0 },
    recognizeVoucher (request) {
      const form = new FormData(); form.append('file', request.file); this.recognizeLoading = true
      this.$http({ url: this.$http.adornUrl('/erp/spot-financing/voucher/recognize'), method: 'post', data: form, headers: { 'Content-Type': 'multipart/form-data' } }).then(({ data }) => {
        if (!data || data.code !== 0) { this.$message.error((data && data.msg) || '水单识别失败'); return }
        const voucher = data.voucher || {}
        const serialNo = voucher.transactionNo || voucher.voucherNo || ''
        this.financeForm = {
          ...this.financeForm,
          recognizedAmount: Number(voucher.recognizedAmount || 0),
          modifiedAmount: Number(voucher.recognizedAmount || 0),
          paymentDate: voucher.paymentDate || '',
          filePath: voucher.filePath || '',
          fileName: voucher.fileName || request.file.name,
          rawText: voucher.rawText || '',
          payerNameRecognized: voucher.payerName || '',
          payerNameModified: voucher.payerName || '',
          payeeNameRecognized: voucher.payeeName || '',
          payeeNameModified: voucher.payeeName || '',
          serialNoRecognized: serialNo,
          serialNoModified: serialNo
        }
        this.$nextTick(() => this.$refs.financeForm && this.$refs.financeForm.clearValidate('filePath'))
      }).finally(() => { this.recognizeLoading = false })
    },
    submitFinance () {
      this.$refs.financeForm.validate(valid => {
        if (!valid) return
        if (!this.selectedRows.length) { this.$message.warning('请至少勾选一条需要融资的库存'); return }
        if (this.selectedRows.some(row => Number(row.financingBoxes || 0) <= 0 || Number(row.financingBoxes) > Number(row.availableBoxes))) { this.$message.warning('请核对本次融资箱数'); return }
        const doSubmit = () => {
          this.submitLoading = true
          const loading = this.$loading({ lock: true, text: '正在确认融资并更新货权...' })
          const payload = { ...this.financeForm, itemList: this.selectedRows.map(row => ({ ...row, financingBoxes: Number(row.financingBoxes) })) }
          this.$http({ url: this.$http.adornUrl('/erp/spot-financing/confirm'), method: 'post', data: this.$http.adornData(payload) }).then(({ data }) => {
            if (data && data.code === 0) { this.$message.success('现货融资确认成功'); this.createVisible = false; this.getDataList() } else { this.$message.error((data && data.msg) || '确认融资失败') }
          }).finally(() => { this.submitLoading = false; loading.close() })
        }
        if (this.isOverReference) { this.$confirm(`确认融资本金超过参考货值 ${this.money(this.selectedReferenceAmount)}，是否仍要确认？`, '金额核对提醒', { type: 'warning', confirmButtonText: '仍然确认', cancelButtonText: '返回核对' }).then(doSubmit).catch(() => {}) } else doSubmit()
      })
    },
    openDetail (id) { this.detailVisible = true; this.detailData = {}; this.$http({ url: this.$http.adornUrl(`/erp/spot-financing/info/${id}`), method: 'get' }).then(({ data }) => { if (data && data.code === 0) this.detailData = data.financing || {} }) },
    previewVoucher (id) { const token = this.$cookie.get('token'); window.open(this.$http.adornUrl(`/erp/spot-financing/voucher/download/${id}?preview=1&token=${encodeURIComponent(token)}`), '_blank') },
    rowWeight (row) { return Number(row.estimatedUnitWeightKg || 0) * Number(row.financingBoxes || 0) },
    rowReference (row) { return this.rowWeight(row) * Number(row.purchaseUnitPrice || 0) },
    money (value) { return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    quantity (value) { return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) },
    price (value) { return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) }
  }
}
</script>

<style scoped>
.section-head { display:flex; align-items:center; gap:10px; margin:2px 0 12px; color:#35576f; }
.section-head strong { margin-right:auto; font-size:15px; }
.section-head span { margin-left:8px; font-weight:600; color:#1677a8; }
.option-extra { float:right; margin-left:22px; color:#8b98a3; font-size:12px; }
.file-name { margin-left:12px; color:#566875; }
.support-tip { margin-top:6px; color:#8b98a3; font-size:12px; }
.amount-warning { margin-top:10px; color:#d13c35; font-size:13px; font-weight:600; }
</style>
