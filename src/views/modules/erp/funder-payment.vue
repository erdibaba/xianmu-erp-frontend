<template>
  <div class="mod-funder-payment">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input v-model="queryForm.keyword" clearable placeholder="打款单号/资方名称" @keyup.enter.native="getDataList()"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:funderpayment:save')" type="success" @click="openCreate()">新增资方打款</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="paymentNo" label="打款单号" min-width="190"></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="210" show-overflow-tooltip></el-table-column>
      <el-table-column prop="paymentDate" label="打款日期" width="120" align="center"></el-table-column>
      <el-table-column label="识别金额" width="140" align="right">
        <template slot-scope="scope">{{ money(scope.row.recognizedAmount) }}</template>
      </el-table-column>
      <el-table-column label="确认金额" width="140" align="right">
        <template slot-scope="scope"><strong>{{ money(scope.row.modifiedAmount) }}</strong></template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template><el-tag type="success" size="small">已确认</el-tag></template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="150" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row.id)">详情</el-button>
          <el-button type="text" size="small" @click="downloadVoucher(scope.row.id, scope.row.fileName)">下载凭证</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex" :page-size="pageSize" :page-sizes="[10, 20, 50, 100]" :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle" @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog title="新增资方打款" :visible.sync="createVisible" width="1050px" :close-on-click-modal="false">
      <el-form ref="paymentForm" :model="paymentForm" :rules="paymentRules" label-width="125px">
        <el-row :gutter="18">
          <el-col :span="12">
            <el-form-item label="资方" prop="funderId">
              <el-select
                v-model="paymentForm.funderId" filterable remote clearable
                :remote-method="searchFunders" :loading="funderLoading"
                placeholder="输入资方编码或名称搜索" style="width:100%">
                <el-option v-for="item in funderOptions" :key="item.id" :label="item.partnerName" :value="item.id">
                  <span>{{ item.partnerName }}</span>
                  <span class="option-extra">{{ item.partnerCode }} / 年利率 {{ rateLabel(item) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资方打款日期" prop="paymentDate">
              <el-date-picker v-model="paymentForm.paymentDate" type="date" value-format="yyyy-MM-dd" placeholder="请选择打款日期" style="width:100%"></el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="识别金额"><el-input :value="money(paymentForm.recognizedAmount)" disabled></el-input></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="修改金额" prop="modifiedAmount">
              <el-input-number v-model="paymentForm.modifiedAmount" :min="0" :precision="2" :controls="false" style="width:100%"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="资方打款凭证" prop="filePath">
              <el-upload action="#" :show-file-list="false" :http-request="recognizePaymentVoucher" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="primary" plain :loading="recognizeLoading">上传并识别凭证</el-button>
              </el-upload>
              <span class="file-name">{{ paymentForm.fileName || '尚未上传' }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="选择预销售单" prop="selectedPresaleIds">
              <el-select
                v-model="paymentForm.selectedPresaleIds" multiple filterable remote
                :remote-method="searchPresales" :loading="presaleLoading"
                placeholder="输入预销售单号、合同号或采购方搜索，最多返回15条"
                style="width:100%" @change="presaleSelectionChange">
                <el-option v-for="item in presaleOptions" :key="item.id" :label="presaleLabel(item)" :value="item.id"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div class="section-title">预销售单金额分摊</div>
        <el-table :data="paymentForm.allocationList" border max-height="360">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="170"></el-table-column>
          <el-table-column prop="sellerContractNo" label="合同号" min-width="160"></el-table-column>
          <el-table-column prop="customerReference" label="采购方" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="分摊贷款本金" width="190">
            <template slot-scope="scope">
              <el-input-number v-model="scope.row.allocationAmount" :min="0" :precision="2" :controls="false" style="width:160px"></el-input-number>
            </template>
          </el-table-column>
        </el-table>
        <div class="allocation-summary">
          <strong>分摊合计：{{ money(allocationTotal) }}</strong>
          <span :class="allocationMatched ? 'matched' : 'mismatch'">{{ allocationMatched ? '与修改金额一致' : '分摊合计必须与修改金额完全一致' }}</span>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="confirmPayment()">确认打款并生成贷款</el-button>
      </span>
    </el-dialog>

    <el-dialog title="资方打款详情" :visible.sync="detailVisible" width="950px">
      <el-descriptions v-if="detailData.id" :column="3" border>
        <el-descriptions-item label="打款单号">{{ detailData.paymentNo }}</el-descriptions-item>
        <el-descriptions-item label="资方">{{ detailData.funderName }}</el-descriptions-item>
        <el-descriptions-item label="打款日期">{{ detailData.paymentDate }}</el-descriptions-item>
        <el-descriptions-item label="识别金额">{{ money(detailData.recognizedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="确认金额">{{ money(detailData.modifiedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="归档原件"><el-button type="text" @click="downloadVoucher(detailData.id, detailData.fileName)">下载凭证</el-button></el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailData.allocationList || []" border style="margin-top:16px">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="180"></el-table-column>
        <el-table-column prop="sellerContractNo" label="合同号" min-width="180"></el-table-column>
        <el-table-column label="分摊贷款本金" width="180" align="right">
          <template slot-scope="scope">{{ money(scope.row.allocationAmount) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
const emptyPayment = () => ({
  funderId: null,
  recognizedAmount: 0,
  modifiedAmount: 0,
  paymentDate: '',
  filePath: '',
  fileName: '',
  rawText: '',
  selectedPresaleIds: [],
  allocationList: []
})

export default {
  data () {
    return {
      queryForm: { keyword: '' },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      createVisible: false,
      detailVisible: false,
      detailData: {},
      paymentForm: emptyPayment(),
      funderOptions: [],
      presaleOptions: [],
      funderLoading: false,
      presaleLoading: false,
      recognizeLoading: false,
      submitLoading: false,
      paymentRules: {
        funderId: [{ required: true, message: '请选择资方', trigger: 'change' }],
        paymentDate: [{ required: true, message: '请选择资方打款日期', trigger: 'change' }],
        modifiedAmount: [{ required: true, message: '请输入修改金额', trigger: 'blur' }],
        filePath: [{ required: true, message: '请上传资方打款凭证', trigger: 'change' }],
        selectedPresaleIds: [{ type: 'array', required: true, min: 1, message: '请至少选择一张预销售单', trigger: 'change' }]
      }
    }
  },
  computed: {
    allocationTotal () {
      return (this.paymentForm.allocationList || []).reduce((sum, item) => sum + Number(item.allocationAmount || 0), 0)
    },
    allocationMatched () {
      return Math.round(this.allocationTotal * 100) === Math.round(Number(this.paymentForm.modifiedAmount || 0) * 100)
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    money (value) { return Number(value || 0).toFixed(2) },
    rateLabel (item) {
      return item.annualInterestRate === null || item.annualInterestRate === undefined ? '未维护' : item.annualInterestRate + '%'
    },
    presaleLabel (item) {
      return `${item.orderNo || '-'} / ${item.sellerContractNo || '无合同号'} / ${item.customerReference || '无采购方'}`
    },
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/payment/list'),
        method: 'get',
        params: this.$http.adornParams({ page: this.pageIndex, limit: this.pageSize, keyword: this.queryForm.keyword })
      }).then(({ data }) => {
        this.dataListLoading = false
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.$message.error((data && data.msg) || '获取资方打款列表失败')
        }
      }).catch(() => { this.dataListLoading = false })
    },
    sizeChangeHandle (value) { this.pageSize = value; this.pageIndex = 1; this.getDataList() },
    currentChangeHandle (value) { this.pageIndex = value; this.getDataList() },
    openCreate () {
      this.paymentForm = emptyPayment()
      this.funderOptions = []
      this.presaleOptions = []
      this.createVisible = true
      this.searchFunders('')
      this.searchPresales('')
      this.$nextTick(() => this.$refs.paymentForm && this.$refs.paymentForm.clearValidate())
    },
    searchFunders (keyword) {
      this.funderLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/funder-options'),
        method: 'get',
        params: this.$http.adornParams({ keyword })
      }).then(({ data }) => {
        this.funderLoading = false
        this.funderOptions = (data && data.list) || []
      }).catch(() => { this.funderLoading = false })
    },
    searchPresales (keyword) {
      this.presaleLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/presale-options'),
        method: 'get',
        params: this.$http.adornParams({ keyword })
      }).then(({ data }) => {
        this.presaleLoading = false
        const selectedRows = (this.paymentForm.allocationList || []).map(row => ({
          id: row.presaleOrderId,
          orderNo: row.presaleOrderNo,
          sellerContractNo: row.sellerContractNo,
          customerReference: row.customerReference
        }))
        const result = (data && data.list) || []
        this.presaleOptions = selectedRows.concat(result.filter(item => !selectedRows.some(selected => selected.id === item.id)))
      }).catch(() => { this.presaleLoading = false })
    },
    presaleSelectionChange (ids) {
      const oldRows = this.paymentForm.allocationList || []
      this.paymentForm.allocationList = ids.map(id => {
        const old = oldRows.find(item => item.presaleOrderId === id)
        if (old) return old
        const option = this.presaleOptions.find(item => item.id === id) || {}
        return {
          presaleOrderId: id,
          presaleOrderNo: option.orderNo,
          sellerContractNo: option.sellerContractNo,
          customerReference: option.customerReference,
          allocationAmount: 0
        }
      })
    },
    recognizePaymentVoucher (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.recognizeLoading = true
      const loading = this.$loading({ lock: true, text: '正在识别并归档资方打款凭证...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          this.paymentForm.recognizedAmount = Number(voucher.recognizedAmount || 0)
          this.paymentForm.modifiedAmount = Number(voucher.recognizedAmount || 0)
          this.paymentForm.paymentDate = voucher.paymentDate || ''
          this.paymentForm.filePath = voucher.filePath || ''
          this.paymentForm.fileName = voucher.fileName || request.file.name
          this.paymentForm.rawText = voucher.rawText || ''
          this.$message.success('凭证识别完成，请核对金额和日期')
        } else {
          this.$message.error((data && data.msg) || '凭证识别失败')
        }
      }).catch(() => this.$message.error('凭证识别请求失败')).finally(() => {
        this.recognizeLoading = false
        loading.close()
      })
    },
    confirmPayment () {
      this.$refs.paymentForm.validate(valid => {
        if (!valid) return
        if (!this.allocationMatched) {
          this.$message.error('预销售单分摊金额合计必须与修改金额完全一致')
          return
        }
        if ((this.paymentForm.allocationList || []).some(item => Number(item.allocationAmount || 0) <= 0)) {
          this.$message.error('每张预销售单的分摊贷款本金都必须大于0')
          return
        }
        const selectedFunder = this.funderOptions.find(item => item.id === this.paymentForm.funderId)
        if (selectedFunder && (selectedFunder.annualInterestRate === null || selectedFunder.annualInterestRate === undefined || Number(selectedFunder.annualInterestRate) <= 0)) {
          this.$message.error('所选资方未维护年利率，请先到往来单位维护')
          return
        }
        this.submitLoading = true
        const loading = this.$loading({ lock: true, text: '正在确认打款并生成贷款记录...' })
        this.$http({
          url: this.$http.adornUrl('/erp/funder-finance/payment/confirm'),
          method: 'post',
          data: this.$http.adornData(this.paymentForm)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('资方打款已确认，贷款记录已生成')
            this.createVisible = false
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '确认资方打款失败')
          }
        }).catch(() => this.$message.error('确认资方打款请求失败')).finally(() => {
          this.submitLoading = false
          loading.close()
        })
      })
    },
    openDetail (id) {
      const loading = this.$loading({ lock: true, text: '正在加载资方打款详情...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/payment/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.detailData = data.payment || {}
          this.detailVisible = true
        } else {
          this.$message.error((data && data.msg) || '获取打款详情失败')
        }
      }).finally(() => loading.close())
    },
    downloadVoucher (id, fileName) {
      const loading = this.$loading({ lock: true, text: '正在下载归档凭证...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/payment/download/${id}`),
        method: 'get',
        responseType: 'blob'
      }).then(response => {
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || '资方打款凭证'
        link.click()
        URL.revokeObjectURL(url)
      }).finally(() => loading.close())
    }
  }
}
</script>

<style scoped>
.mod-funder-payment .el-pagination { margin-top: 15px; text-align: right; }
.option-extra { float: right; color: #8492a6; font-size: 12px; margin-left: 20px; }
.file-name { margin-left: 12px; color: #606266; }
.section-title { margin: 8px 0 12px; font-weight: 700; color: #1f5f78; }
.allocation-summary { display: flex; justify-content: flex-end; gap: 20px; margin-top: 12px; }
.matched { color: #2b8a3e; }
.mismatch { color: #d93025; font-weight: 700; }
</style>
