<template>
  <div class="mod-erp-presale-inventory">
    <el-alert
      title="预售单库存按预售单产品行统计，确认函上传后按产品编码匹配并逐步扣减。组合编码会按 / 拆分匹配，市场流通名称按 / 拼接展示。"
      type="info"
      :closable="false"
      show-icon>
    </el-alert>

    <el-form :inline="true" :model="queryForm" class="query-form" size="small">
      <el-form-item>
        <el-select v-model="queryForm.contractNo" filterable remote clearable reserve-keyword placeholder="请选择预售合同号"
          :remote-method="keyword => remoteOption('contract', keyword)" :loading="isOptionLoading('contract')"
          @visible-change="visible => openOption('contract', visible)">
          <el-option v-for="item in optionList('contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.productCode" filterable remote clearable reserve-keyword placeholder="请选择产品"
          :remote-method="keyword => remoteOption('product', keyword)" :loading="isOptionLoading('product')"
          @visible-change="visible => openOption('product', visible)">
          <el-option v-for="item in optionList('product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.buyerName" filterable remote clearable reserve-keyword placeholder="请选择采购方"
          :remote-method="keyword => remoteOption('buyer', keyword)" :loading="isOptionLoading('buyer')"
          @visible-change="visible => openOption('buyer', visible)">
          <el-option v-for="item in optionList('buyer')" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.brandName" filterable remote clearable reserve-keyword placeholder="请选择品牌方"
          :remote-method="keyword => remoteOption('brand', keyword)" :loading="isOptionLoading('brand')"
          @visible-change="visible => openOption('brand', visible)">
          <el-option v-for="item in optionList('brand')" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.status" clearable placeholder="确认状态" style="width: 130px;">
          <el-option label="未确认" value="0"></el-option>
          <el-option label="部分确认" value="1"></el-option>
          <el-option label="已确认完成" value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-date-picker
          v-model="orderDateRange"
          type="daterange"
          value-format="yyyy-MM-dd"
          range-separator="至"
          start-placeholder="下单开始"
          end-placeholder="下单结束"
          @change="getDataList()">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button @click="resetQuery()">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      :data="dataList"
      border
      stripe
      v-loading="dataListLoading"
      height="620">
      <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
      <el-table-column prop="sellerContractNo" label="预售单合同号" min-width="170" fixed="left" show-overflow-tooltip></el-table-column>
      <el-table-column prop="brandName" label="品牌方" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column prop="customerReference" label="采购方" min-width="170" show-overflow-tooltip></el-table-column>
      <el-table-column label="下单日期" width="115" align="center">
        <template slot-scope="scope">{{ formatDate(scope.row.orderDate) }}</template>
      </el-table-column>
      <el-table-column prop="productCodeText" label="产品编码" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="220" show-overflow-tooltip></el-table-column>
      <el-table-column label="预售重量(吨)" width="120" align="right">
        <template slot-scope="scope">{{ number(scope.row.presaleWeightTon, 4) }}</template>
      </el-table-column>
      <el-table-column label="预售重量(KG)" width="125" align="right">
        <template slot-scope="scope">{{ number(scope.row.presaleWeightKg, 2) }}</template>
      </el-table-column>
      <el-table-column label="已确认重量(KG)" width="135" align="right">
        <template slot-scope="scope">{{ number(scope.row.confirmedWeightKg, 2) }}</template>
      </el-table-column>
      <el-table-column label="剩余预售重量(KG)" width="155" align="right">
        <template slot-scope="scope">
          <span :class="{ 'inventory-danger': Number(scope.row.remainingWeightKg || 0) < 0 }">
            {{ number(scope.row.remainingWeightKg, 2) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="confirmPercent" label="确认进度" width="105" align="center"></el-table-column>
      <el-table-column label="状态" width="110" align="center">
        <template slot-scope="scope">
          <el-tag size="small" :type="statusTagType(scope.row.confirmStatus)">
            {{ scope.row.confirmStatusText || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="confirmContractNosText" label="已确认函合同" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column label="操作" width="90" fixed="right" align="center">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="detailHandle(scope.row)">详情</el-button>
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
      title="确认函扣减明细"
      :visible.sync="detailVisible"
      width="980px"
      :close-on-click-modal="false">
      <el-descriptions :column="2" border size="small" class="detail-summary">
        <el-descriptions-item label="预售合同号">{{ currentRow.sellerContractNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品编码">{{ currentRow.productCodeText || '-' }}</el-descriptions-item>
        <el-descriptions-item label="市场流通名称">{{ currentRow.marketCirculationName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="剩余预售重量(KG)">{{ number(currentRow.remainingWeightKg, 2) }}</el-descriptions-item>
      </el-descriptions>
      <el-table
        :data="detailList"
        border
        stripe
        height="360"
        v-loading="detailLoading">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="confirmContractNo" label="客户订单确认函合同号" min-width="180" show-overflow-tooltip></el-table-column>
        <el-table-column prop="containerNo" label="集装箱号" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="sourceProductCode" label="确认函产品编码" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="190" show-overflow-tooltip></el-table-column>
        <el-table-column label="确认重量(KG)" width="130" align="right">
          <template slot-scope="scope">{{ number(scope.row.confirmedWeightKg, 2) }}</template>
        </el-table-column>
        <el-table-column label="确认时间" width="120" align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.confirmTime) }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="detailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: {
    embedded: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      queryForm: {
        contractNo: '',
        productCode: '',
        buyerName: '',
        brandName: '',
        status: ''
      },
      optionMap: {},
      optionLoading: {},
      optionTimers: {},
      optionRequestMap: {},
      orderDateRange: [],
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      detailVisible: false,
      detailLoading: false,
      currentRow: {},
      detailList: []
    }
  },
  mounted () {
    if (this.embedded) {
      this.getDataList()
    }
  },
  activated () {
    if (!this.embedded) {
      this.getDataList()
    }
  },
  methods: {
    optionList (optionType) {
      return this.optionMap[optionType] || []
    },
    isOptionLoading (optionType) {
      return !!this.optionLoading[optionType]
    },
    openOption (optionType, visible) {
      if (visible) this.remoteOption(optionType, '')
    },
    remoteOption (optionType, keyword) {
      if (this.optionTimers[optionType]) clearTimeout(this.optionTimers[optionType])
      this.optionTimers[optionType] = setTimeout(() => this.loadOptions(optionType, keyword), 250)
    },
    loadOptions (optionType, keyword) {
      const fieldMap = {
        contract: 'contractNo',
        product: 'productCode',
        buyer: 'buyerName',
        brand: 'brandName'
      }
      const selected = this.queryForm[fieldMap[optionType]] || ''
      const params = Object.assign({}, this.queryForm, {
        optionType: optionType,
        optionKeyword: keyword || '',
        orderDateStart: this.orderDateRange && this.orderDateRange.length ? this.orderDateRange[0] : '',
        orderDateEnd: this.orderDateRange && this.orderDateRange.length ? this.orderDateRange[1] : ''
      })
      const requestId = (this.optionRequestMap[optionType] || 0) + 1
      this.optionRequestMap[optionType] = requestId
      this.$set(this.optionLoading, optionType, true)
      this.$http({
        url: this.$http.adornUrl('/erp/presale/presale-inventory/options'),
        method: 'get',
        params: this.$http.adornParams(params)
      }).then(({data}) => {
        if (this.optionRequestMap[optionType] !== requestId) return
        let list = (data && data.list) || []
        if (selected && !list.some(item => String(item.value) === String(selected))) {
          list = [{ value: selected, label: selected }].concat(list)
        }
        this.$set(this.optionMap, optionType, list.slice(0, 15))
        this.$set(this.optionLoading, optionType, false)
      }).catch(() => {
        if (this.optionRequestMap[optionType] !== requestId) return
        this.$set(this.optionLoading, optionType, false)
      })
    },
    getDataList () {
      this.dataListLoading = true
      const params = {
        page: this.pageIndex,
        limit: this.pageSize,
        contractNo: this.queryForm.contractNo,
        productCode: this.queryForm.productCode,
        buyerName: this.queryForm.buyerName,
        brandName: this.queryForm.brandName,
        status: this.queryForm.status,
        orderDateStart: this.orderDateRange && this.orderDateRange.length ? this.orderDateRange[0] : '',
        orderDateEnd: this.orderDateRange && this.orderDateRange.length ? this.orderDateRange[1] : ''
      }
      this.$http({
        url: this.$http.adornUrl('/erp/presale/presale-inventory'),
        method: 'get',
        params: this.$http.adornParams(params)
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.dataList = []
          this.totalPage = 0
          this.$message.error(data.msg || '获取预售单库存失败')
        }
        this.dataListLoading = false
      }).catch(() => {
        this.dataListLoading = false
        this.$message.error('获取预售单库存失败，请检查后端服务')
      })
    },
    resetQuery () {
      this.queryForm = {
        contractNo: '',
        productCode: '',
        buyerName: '',
        brandName: '',
        status: ''
      }
      this.orderDateRange = []
      this.pageIndex = 1
      this.getDataList()
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
    detailHandle (row) {
      this.currentRow = Object.assign({}, row)
      this.detailVisible = true
      this.detailLoading = true
      this.detailList = []
      this.$http({
        url: this.$http.adornUrl(`/erp/presale/presale-inventory/detail/${row.presaleOrderItemId}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({data}) => {
        if (data && data.code === 0) {
          this.detailList = data.list || []
        } else {
          this.$message.error(data.msg || '获取确认函扣减明细失败')
        }
        this.detailLoading = false
      }).catch(() => {
        this.detailLoading = false
        this.$message.error('获取确认函扣减明细失败，请检查后端服务')
      })
    },
    statusTagType (status) {
      if (Number(status) === 2) return 'success'
      if (Number(status) === 1) return 'warning'
      return 'info'
    },
    formatDate (value) {
      return value ? String(value).slice(0, 10) : '-'
    },
    number (value, digits) {
      const num = Number(value || 0)
      return Number.isFinite(num) ? num.toFixed(digits) : Number(0).toFixed(digits)
    }
  }
}
</script>

<style scoped>
.mod-erp-presale-inventory .query-form {
  margin-top: 12px;
}

.mod-erp-presale-inventory .query-form .el-select {
  width: 210px;
}

.detail-summary {
  margin-bottom: 12px;
}

.inventory-danger {
  color: #e23b3b;
  font-weight: 600;
}
</style>
