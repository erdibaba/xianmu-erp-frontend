<template>
  <div class="inventory-cost-mobile-page">
    <div class="mobile-shell">
      <div class="mobile-hero">
        <div>
          <div class="eyebrow">鲜牧ERP</div>
          <h2>库存成本价</h2>
          <p>按当前剩余库存重量动态计算含税采购价、资金成本和仓储费。</p>
        </div>
      </div>

      <div class="search-card">
        <el-input v-model="queryForm.keyword" placeholder="产品编码/名称" clearable @keyup.enter.native="getDataList"></el-input>
        <el-select v-model="queryForm.warehouseId" filterable clearable placeholder="仓库" @change="warehouseChange">
          <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
        </el-select>
        <el-select
          v-model="queryForm.containerNos"
          multiple
          filterable
          remote
          clearable
          collapse-tags
          reserve-keyword
          :disabled="!queryForm.warehouseId"
          :loading="containerLoading"
          :remote-method="remoteSearchContainers"
          placeholder="柜号">
          <el-option v-for="item in containerOptions" :key="item" :label="item" :value="item"></el-option>
        </el-select>
        <el-input v-model="queryForm.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getDataList"></el-input>
        <div class="search-actions">
          <el-checkbox v-model="queryForm.onlyAvailable" true-label="1" false-label="0">只看可售</el-checkbox>
          <div>
            <el-button size="small" @click="resetQuery">重置</el-button>
            <el-button size="small" type="primary" :loading="dataListLoading" @click="getDataList">查询</el-button>
          </div>
        </div>
      </div>

      <div v-loading="dataListLoading" class="card-list">
        <el-empty v-if="!dataList.length && !dataListLoading" description="暂无库存成本数据"></el-empty>
        <div v-for="item in dataList" :key="cardKey(item)" class="cost-card" @click="openDetailDialog(item)">
          <div class="card-top">
            <div>
              <div class="product-code">{{ item.productCode || '-' }}</div>
              <div class="contract-no">{{ item.contractNo || '-' }}</div>
              <div class="product-name">{{ item.productName || item.productNameEn || '-' }}</div>
            </div>
            <div class="cost-badge">
              <span>{{ numberText(item.costPriceKg, 4) }}</span>
              <em>元/KG</em>
            </div>
          </div>
          <div class="en-name">{{ item.productNameEn || '-' }}</div>
          <div class="metric-grid">
            <div>
              <label>货权</label>
              <span>{{ item.ownershipName || '-' }}</span>
            </div>
            <div>
              <label>可售箱数</label>
              <span>{{ numberText(item.availableBoxes, 0) }}</span>
            </div>
            <div>
              <label>可售重量</label>
              <span>{{ numberText(item.availableWeightKg, 2) }} KG</span>
            </div>
            <div>
              <label>含税采购单价</label>
              <span>{{ numberText(item.purchasePriceKg, 4) }}</span>
            </div>
            <div>
              <label>采购成本</label>
              <span>{{ moneyText(item.purchaseAmount) }}</span>
            </div>
            <div>
              <label>分摊费用</label>
              <span>{{ moneyText(item.allocatedFeeAmount) }}</span>
            </div>
          </div>
          <div class="card-footer">
            <span>成本总额 {{ moneyText(item.totalCostAmount) }}</span>
            <el-button type="text" size="mini">费用明细</el-button>
          </div>
        </div>
      </div>

      <el-dialog
        title="费用明细"
        :visible.sync="detailDialogVisible"
        width="92%"
        custom-class="mobile-cost-detail-dialog"
        append-to-body>
        <div v-if="currentRow" class="detail-head">
          <strong>{{ currentRow.productCode || '-' }}</strong>
          <span>确认函合同号：{{ currentRow.contractNo || '-' }}</span>
          <span>{{ currentRow.productName || '-' }}</span>
          <em>{{ currentRow.ownershipName || '-' }}</em>
        </div>
        <div v-loading="detailLoading" class="detail-card-list">
          <el-empty v-if="!detailList.length && !detailLoading" description="暂无费用明细"></el-empty>
          <div v-for="(item, index) in detailList" :key="index" class="detail-card">
            <div class="detail-title">
              <span>{{ item.costType || '-' }}</span>
              <strong>{{ moneyText(item.allocatedAmount) }}</strong>
            </div>
            <div class="detail-line">{{ item.costName || '-' }}</div>
            <div class="detail-line">来源：{{ item.sourceNo || '-' }}</div>
            <div class="detail-line">合同：{{ item.contractNo || '-' }}</div>
            <div class="detail-line">柜号：{{ item.containerNo || '-' }} / 厂号：{{ item.factoryNo || '-' }}</div>
            <div class="detail-line">生产日期：{{ dateText(item.productionDate) }} / 过期日期：{{ dateText(item.expiryDate) }}</div>
            <div class="detail-line">剩余箱数：{{ numberText(item.availableBoxes, 0) }}</div>
            <div class="detail-line">本行重量：{{ numberText(item.basisWeightKg, 2) }} KG</div>
            <div v-if="item.remark" class="detail-remark">{{ item.remark }}</div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        warehouseList: [],
        containerOptions: [],
        containerLoading: false,
        queryForm: {
          keyword: '',
          warehouseId: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        },
        dataList: [],
        dataListLoading: false,
        detailDialogVisible: false,
        detailLoading: false,
        detailList: [],
        currentRow: null
      }
    },
    activated () {
      this.loadWarehouses()
      this.getDataList()
    },
    methods: {
      getDataList () {
        this.dataListLoading = true
        const params = Object.assign({}, this.queryForm, {
          containerNos: (this.queryForm.containerNos || []).join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.dataList = data.list || []
          } else {
            this.dataList = []
            this.$message.error((data && data.msg) || '获取库存成本失败')
          }
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      openDetailDialog (row) {
        this.currentRow = row
        this.detailList = []
        this.detailDialogVisible = true
        this.detailLoading = true
        const params = Object.assign({}, this.queryForm, {
          productId: row.productId,
          confirmId: row.confirmId || '',
          contractNo: row.contractNo || '',
          ownershipName: row.ownershipName || '',
          containerNos: (this.queryForm.containerNos || []).join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/spot/details'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.detailList = data.list || []
          } else {
            this.detailList = []
            this.$message.error((data && data.msg) || '获取成本明细失败')
          }
        }).finally(() => {
          this.detailLoading = false
        })
      },
      resetQuery () {
        this.queryForm = {
          keyword: '',
          warehouseId: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        }
        this.containerOptions = []
        this.getDataList()
      },
      loadWarehouses () {
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/select'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({ data }) => {
          this.warehouseList = (data && data.list) || []
        })
      },
      warehouseChange () {
        this.queryForm.containerNos = []
        this.containerOptions = []
        this.remoteSearchContainers('')
      },
      remoteSearchContainers (keyword) {
        if (!this.queryForm.warehouseId) {
          this.containerOptions = []
          return
        }
        this.containerLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/containers'),
          method: 'get',
          params: this.$http.adornParams({
            inventoryType: 'spot',
            warehouseId: this.queryForm.warehouseId,
            keyword: keyword || ''
          })
        }).then(({ data }) => {
          const list = (data && data.list) || []
          const selected = this.queryForm.containerNos || []
          this.containerOptions = Array.from(new Set(selected.concat(list)))
        }).finally(() => {
          this.containerLoading = false
        })
      },
      cardKey (item) {
        return [item.productId, item.confirmId, item.contractNo, item.ownershipName, item.productCode].join('-')
      },
      moneyText (value) {
        return this.numberText(value, 2)
      },
      numberText (value, digits) {
        const num = Number(value || 0)
        return num.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
      },
      dateText (value) {
        if (!value) return '-'
        return String(value).slice(0, 10)
      }
    }
  }
</script>

<style scoped>
  .inventory-cost-mobile-page {
    min-height: calc(100vh - 80px);
    margin: -20px;
    padding: 16px 10px 28px;
    background:
      radial-gradient(circle at 15% 8%, rgba(23, 179, 163, 0.18), transparent 26%),
      linear-gradient(180deg, #edf8f7 0%, #f6fbfa 45%, #eef4f2 100%);
  }

  .mobile-shell {
    width: 390px;
    max-width: 100%;
    margin: 0 auto;
  }

  .mobile-hero {
    padding: 20px 18px;
    border-radius: 24px;
    color: #ffffff;
    background: linear-gradient(135deg, #0b7d88 0%, #17b3a3 58%, #46c7a8 100%);
    box-shadow: 0 18px 34px rgba(12, 115, 112, 0.24);
  }

  .mobile-hero .eyebrow {
    font-size: 12px;
    letter-spacing: 2px;
    opacity: 0.86;
  }

  .mobile-hero h2 {
    margin: 8px 0 6px;
    font-size: 28px;
    line-height: 1;
  }

  .mobile-hero p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    opacity: 0.9;
  }

  .search-card,
  .cost-card,
  .detail-card {
    border: 1px solid rgba(23, 179, 163, 0.14);
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 12px 28px rgba(28, 83, 80, 0.08);
  }

  .search-card {
    display: grid;
    gap: 10px;
    margin: 12px 0;
    padding: 12px;
  }

  .search-card /deep/ .el-select,
  .search-card /deep/ .el-input {
    width: 100%;
  }

  .search-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-list {
    min-height: 260px;
  }

  .cost-card {
    margin-bottom: 12px;
    padding: 14px;
  }

  .card-top,
  .card-footer,
  .detail-title {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .product-code {
    color: #0b7d88;
    font-size: 13px;
    font-weight: 700;
  }

  .contract-no {
    margin-top: 2px;
    color: #6b7a78;
    font-size: 12px;
    font-weight: 650;
  }

  .product-name {
    margin-top: 3px;
    color: #1f2d2b;
    font-size: 16px;
    font-weight: 700;
  }

  .en-name {
    margin: 8px 0 10px;
    color: #6b7a78;
    font-size: 12px;
    line-height: 1.45;
  }

  .cost-badge {
    min-width: 92px;
    padding: 8px 10px;
    border-radius: 14px;
    text-align: right;
    color: #0b7d88;
    background: #e8f8f5;
  }

  .cost-badge span {
    display: block;
    font-size: 16px;
    font-weight: 800;
  }

  .cost-badge em {
    font-size: 11px;
    font-style: normal;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .metric-grid div {
    padding: 9px 10px;
    border-radius: 12px;
    background: #f5faf9;
  }

  .metric-grid label {
    display: block;
    color: #8a9695;
    font-size: 11px;
  }

  .metric-grid span {
    display: block;
    margin-top: 3px;
    color: #1f2d2b;
    font-size: 13px;
    font-weight: 650;
    word-break: break-all;
  }

  .card-footer {
    margin-top: 10px;
    color: #4d5c5a;
    font-size: 13px;
    font-weight: 650;
  }

  .detail-head {
    display: grid;
    gap: 4px;
    margin-bottom: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: #edf8f7;
  }

  .detail-head strong {
    color: #0b7d88;
  }

  .detail-head span,
  .detail-head em {
    color: #4d5c5a;
    font-style: normal;
  }

  .detail-card-list {
    min-height: 220px;
    max-height: 62vh;
    overflow-y: auto;
  }

  .detail-card {
    margin-bottom: 10px;
    padding: 12px;
  }

  .detail-title span {
    color: #0b7d88;
    font-weight: 700;
  }

  .detail-title strong {
    color: #1f2d2b;
  }

  .detail-line,
  .detail-remark {
    margin-top: 6px;
    color: #606f6d;
    font-size: 12px;
    line-height: 1.45;
  }

  .detail-remark {
    padding-top: 6px;
    border-top: 1px dashed #d8e8e5;
  }

  /deep/ .mobile-cost-detail-dialog {
    max-width: 420px;
    border-radius: 18px;
  }
</style>
