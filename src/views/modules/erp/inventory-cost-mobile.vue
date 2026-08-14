<template>
  <div class="sales-inventory-mobile-page">
    <div class="mobile-shell">
      <header class="mobile-hero">
        <span class="eyebrow">鲜牧 ERP · 销售端</span>
        <h2>销售库存查询</h2>
        <p>按确认函合同查看产品可售库存与保质期批次。</p>
        <div class="inventory-tabs">
          <button :class="{ active: inventoryType === 'spot' }" @click="changeInventoryType('spot')">现货库存</button>
          <button :class="{ active: inventoryType === 'futures' }" @click="changeInventoryType('futures')">期货库存</button>
        </div>
      </header>

      <section class="search-card">
        <el-select
          ref="contractSelect"
          v-model="queryForm.contractNo"
          filterable
          remote
          clearable
          reserve-keyword
          :loading="optionLoading.contract"
          :remote-method="keyword => remoteOptions('contract', keyword)"
          popper-class="sales-inventory-mobile-dropdown"
          @touchstart.native.capture="unlockMobileSelectInput('contractSelect')"
          placeholder="确认函合同号">
          <el-option v-for="item in contractOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <el-select
          ref="productSelect"
          v-model="queryForm.productId"
          filterable
          remote
          clearable
          reserve-keyword
          :loading="optionLoading.product"
          :remote-method="keyword => remoteOptions('product', keyword)"
          popper-class="sales-inventory-mobile-dropdown"
          @touchstart.native.capture="unlockMobileSelectInput('productSelect')"
          placeholder="产品编码 / 市场流通名称">
          <el-option v-for="item in productOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <el-select
          v-model="queryForm.containerNos"
          multiple
          filterable
          remote
          clearable
          collapse-tags
          reserve-keyword
          :loading="optionLoading.container"
          :remote-method="keyword => remoteOptions('container', keyword)"
          popper-class="sales-inventory-mobile-dropdown"
          placeholder="柜号（可多选）">
          <el-option v-for="item in containerOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <el-select
          ref="ownershipSelect"
          v-model="queryForm.ownershipName"
          filterable
          remote
          clearable
          reserve-keyword
          :loading="optionLoading.ownership"
          :remote-method="keyword => remoteOptions('ownership', keyword)"
          popper-class="sales-inventory-mobile-dropdown"
          @touchstart.native.capture="unlockMobileSelectInput('ownershipSelect')"
          placeholder="货权">
          <el-option v-for="item in ownershipOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>

        <el-select v-model="queryForm.temperatureZone" clearable popper-class="sales-inventory-mobile-dropdown" placeholder="温区">
          <el-option label="冷鲜" value="冷鲜"></el-option>
          <el-option label="冷冻" value="冷冻"></el-option>
        </el-select>

        <el-select
          ref="warehouseSelect"
          v-if="inventoryType === 'spot'"
          v-model="queryForm.warehouseId"
          filterable
          clearable
          popper-class="sales-inventory-mobile-dropdown"
          placeholder="仓库"
          @touchstart.native.capture="unlockMobileSelectInput('warehouseSelect')"
          @change="warehouseChange">
          <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
        </el-select>

        <div class="search-actions">
          <el-button size="small" @click="resetQuery">重置</el-button>
          <el-button size="small" type="primary" :loading="dataListLoading" @click="getDataList">查询库存</el-button>
        </div>
      </section>

      <div class="result-summary">
        <span>{{ inventoryType === 'spot' ? '现货' : '期货' }}可售库存</span>
        <strong>{{ dataList.length }} 项</strong>
      </div>

      <main v-loading="dataListLoading" class="card-list">
        <el-empty v-if="!dataList.length && !dataListLoading" description="暂无符合条件的可售库存"></el-empty>
        <article v-for="item in dataList" :key="cardKey(item)" class="inventory-card" @click="openDetailDialog(item)">
          <div class="card-heading">
            <div class="product-identity">
              <span class="product-code">{{ item.productCode || '-' }}</span>
              <h3>{{ item.marketCirculationName || item.productName || '-' }}</h3>
            </div>
            <div v-if="inventoryType === 'spot'" class="price-badge">
              <strong>{{ suggestedPriceText(item) }}</strong>
              <span>建议销售价</span>
            </div>
          </div>

          <div class="contract-strip">
            <span>确认函合同</span>
            <strong>{{ item.contractNo || '-' }}</strong>
          </div>

          <div class="stock-amounts">
            <div>
              <span>可售箱数</span>
              <strong>{{ boxText(item.availableBoxes) }}</strong>
              <em>箱</em>
            </div>
            <div>
              <span>可售重量</span>
              <strong>{{ numberText(item.availableWeightKg, 2) }}</strong>
              <em>KG</em>
            </div>
          </div>

          <dl class="card-details">
            <div><dt>货权</dt><dd>{{ item.ownershipName || '-' }}</dd></div>
            <div><dt>厂号</dt><dd>{{ item.factoryNos || '-' }}</dd></div>
            <div><dt>柜号</dt><dd>{{ item.containerNos || '-' }}</dd></div>
            <div><dt>温区</dt><dd>{{ item.temperatureZone || '-' }}</dd></div>
            <div v-if="inventoryType === 'spot'"><dt>仓库</dt><dd>{{ item.warehouseNames || '-' }}</dd></div>
            <div><dt>预计到港</dt><dd>{{ dateText(item.expectedArrivalDate) }}</dd></div>
            <div><dt>保质期起算日</dt><dd>{{ dateText(item.productionDate) }}</dd></div>
          </dl>

          <footer class="card-footer">
            <span>查看生产日期与剩余保质期</span>
            <i class="el-icon-arrow-right"></i>
          </footer>
        </article>
      </main>

      <el-dialog
        title="库存批次详情"
        :visible.sync="detailDialogVisible"
        width="94%"
        custom-class="sales-inventory-detail-dialog"
        append-to-body>
        <div v-if="currentRow" class="detail-head">
          <span>{{ currentRow.productCode || '-' }}</span>
          <strong>{{ currentRow.marketCirculationName || currentRow.productName || '-' }}</strong>
          <em>{{ currentRow.contractNo || '-' }}</em>
        </div>
        <div v-loading="detailLoading" class="detail-list">
          <el-empty v-if="!detailList.length && !detailLoading" description="暂无批次明细"></el-empty>
          <section v-for="(item, index) in detailList" :key="detailKey(item, index)" class="detail-card">
            <div class="detail-card-top">
              <span>批次 {{ index + 1 }}</span>
              <b :class="shelfLifeClass(item.expiryDate)">{{ shelfLifeText(item.expiryDate) }}</b>
            </div>
            <div class="detail-stock">
              <strong>{{ boxText(item.availableBoxes) }} 箱</strong>
              <span>{{ numberText(item.availableWeightKg, 2) }} KG</span>
            </div>
            <dl>
              <div><dt>生产日期</dt><dd>{{ dateText(item.productionDate) }}</dd></div>
              <div><dt>过期日期</dt><dd>{{ dateText(item.expiryDate) }}</dd></div>
              <div><dt>厂号</dt><dd>{{ item.factoryNo || '-' }}</dd></div>
              <div><dt>柜号</dt><dd>{{ item.containerNo || '-' }}</dd></div>
              <div><dt>温区</dt><dd>{{ item.temperatureZone || '-' }}</dd></div>
              <div v-if="inventoryType === 'spot'"><dt>仓库</dt><dd>{{ item.warehouseName || '-' }}</dd></div>
              <div v-if="inventoryType === 'spot'"><dt>入库时间</dt><dd>{{ dateText(item.inboundDate) }}</dd></div>
            </dl>
          </section>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        inventoryType: 'spot',
        warehouseList: [],
        contractOptions: [],
        productOptions: [],
        containerOptions: [],
        ownershipOptions: [],
        optionLoading: {
          contract: false,
          product: false,
          container: false,
          ownership: false
        },
        queryForm: {
          contractNo: '',
          productId: '',
          containerNos: [],
          ownershipName: '',
          temperatureZone: '',
          warehouseId: ''
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
      this.primeOptions()
      this.getDataList()
    },
    methods: {
      unlockMobileSelectInput (refName) {
        const select = this.$refs[refName]
        const input = select && select.$el && select.$el.querySelector('.el-input__inner')
        if (input) input.removeAttribute('readonly')
      },
      emptyQuery () {
        return {
          contractNo: '',
          productId: '',
          containerNos: [],
          ownershipName: '',
          temperatureZone: '',
          warehouseId: ''
        }
      },
      requestParams (extra) {
        return Object.assign({
          inventoryType: this.inventoryType,
          contractNo: this.queryForm.contractNo || '',
          productId: this.queryForm.productId || '',
          containerNos: (this.queryForm.containerNos || []).join(','),
          ownershipName: this.queryForm.ownershipName || '',
          temperatureZone: this.queryForm.temperatureZone || '',
          warehouseId: this.inventoryType === 'spot' ? (this.queryForm.warehouseId || '') : ''
        }, extra || {})
      },
      getDataList () {
        this.dataListLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/mobile/list'),
          method: 'get',
          params: this.$http.adornParams(this.requestParams())
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.dataList = data.list || []
          } else {
            this.dataList = []
            this.$message.error((data && data.msg) || '获取销售库存失败')
          }
        }).catch(() => {
          this.dataList = []
          this.$message.error('获取销售库存失败，请检查后端服务')
        }).finally(() => {
          this.dataListLoading = false
        })
      },
      openDetailDialog (row) {
        this.currentRow = row
        this.detailList = []
        this.detailDialogVisible = true
        this.detailLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/mobile/details'),
          method: 'get',
          params: this.$http.adornParams(this.requestParams({
            productId: row.productId,
            confirmId: row.confirmId || '',
            contractNo: row.contractNo || '',
            ownershipName: row.ownershipName || ''
          }))
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.detailList = data.list || []
          } else {
            this.$message.error((data && data.msg) || '获取库存批次失败')
          }
        }).finally(() => {
          this.detailLoading = false
        })
      },
      changeInventoryType (type) {
        if (this.inventoryType === type) return
        this.inventoryType = type
        this.queryForm = this.emptyQuery()
        this.clearOptions()
        this.primeOptions()
        this.getDataList()
      },
      resetQuery () {
        this.queryForm = this.emptyQuery()
        this.clearOptions()
        this.primeOptions()
        this.getDataList()
      },
      warehouseChange () {
        this.queryForm.containerNos = []
        this.containerOptions = []
        this.remoteOptions('container', '')
      },
      clearOptions () {
        this.contractOptions = []
        this.productOptions = []
        this.containerOptions = []
        this.ownershipOptions = []
      },
      primeOptions () {
        this.remoteOptions('contract', '')
        this.remoteOptions('product', '')
        this.remoteOptions('container', '')
        this.remoteOptions('ownership', '')
      },
      remoteOptions (optionType, keyword) {
        this.$set(this.optionLoading, optionType, true)
        this.$http({
          url: this.$http.adornUrl('/erp/inventory-cost/mobile/options'),
          method: 'get',
          params: this.$http.adornParams(this.requestParams({
            optionType,
            keyword: keyword || ''
          }))
        }).then(({ data }) => {
          const list = data && data.code === 0 ? (data.list || []) : []
          const property = `${optionType}Options`
          this[property] = this.mergeSelectedOptions(optionType, list)
        }).finally(() => {
          this.$set(this.optionLoading, optionType, false)
        })
      },
      mergeSelectedOptions (optionType, list) {
        const selected = optionType === 'container'
          ? (this.queryForm.containerNos || [])
          : [this.queryForm[optionType === 'contract' ? 'contractNo' : optionType === 'product' ? 'productId' : 'ownershipName']]
        const oldList = this[`${optionType}Options`] || []
        const result = list.slice()
        selected.filter(value => value !== '' && value !== null && value !== undefined).forEach(value => {
          if (!result.some(item => String(item.value) === String(value))) {
            const old = oldList.find(item => String(item.value) === String(value))
            result.unshift(old || { value, label: String(value) })
          }
        })
        return result
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
      cardKey (item) {
        return [item.inventoryType, item.productId, item.confirmId, item.contractNo, item.ownershipName].join('-')
      },
      detailKey (item, index) {
        return [item.contractNo, item.containerNo, item.factoryNo, item.productionDate, item.expiryDate, index].join('-')
      },
      suggestedPriceText (item) {
        const value = item && item.suggestedSalePriceKg
        return value === null || value === undefined || value === '' ? '待维护' : `${this.numberText(value, 4)} 元/KG`
      },
      numberText (value, digits) {
        const number = Number(value || 0)
        return number.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
      },
      boxText (value) {
        return Number(Number(value || 0).toFixed(3)).toLocaleString('zh-CN', { maximumFractionDigits: 3 })
      },
      dateText (value) {
        return value ? String(value).slice(0, 10) : '-'
      },
      shelfLifeDays (expiryDate) {
        if (!expiryDate) return null
        const end = new Date(String(expiryDate).slice(0, 10).replace(/-/g, '/'))
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return Math.ceil((end.getTime() - today.getTime()) / 86400000)
      },
      shelfLifeText (expiryDate) {
        const days = this.shelfLifeDays(expiryDate)
        if (days === null) return '未维护过期日期'
        if (days < 0) return `已过期 ${Math.abs(days)} 天`
        if (days === 0) return '今天到期'
        return `剩余 ${days} 天`
      },
      shelfLifeClass (expiryDate) {
        const days = this.shelfLifeDays(expiryDate)
        if (days === null) return 'neutral'
        if (days <= 0) return 'danger'
        if (days <= 30) return 'warning'
        return 'safe'
      }
    }
  }
</script>

<style scoped>
  .sales-inventory-mobile-page {
    min-height: calc(100vh - 80px);
    margin: -20px;
    padding: 14px 10px 30px;
    color: #183540;
    background:
      radial-gradient(circle at 12% 3%, rgba(36, 135, 210, 0.18), transparent 28%),
      radial-gradient(circle at 90% 22%, rgba(246, 164, 62, 0.16), transparent 24%),
      linear-gradient(180deg, #eef7fb 0%, #f7faf9 45%, #edf3f1 100%);
  }

  .mobile-shell {
    width: 420px;
    max-width: 100%;
    margin: 0 auto;
  }

  .mobile-hero {
    position: relative;
    overflow: hidden;
    padding: 21px 18px 16px;
    border-radius: 25px;
    color: #fff;
    background: linear-gradient(135deg, #075e8f 0%, #1687b8 52%, #30a99b 100%);
    box-shadow: 0 18px 38px rgba(11, 95, 130, 0.24);
  }

  .mobile-hero::after {
    position: absolute;
    top: -52px;
    right: -44px;
    width: 150px;
    height: 150px;
    border: 24px solid rgba(255, 255, 255, 0.09);
    border-radius: 50%;
    content: '';
  }

  .eyebrow {
    font-size: 11px;
    letter-spacing: 2px;
    opacity: 0.82;
  }

  .mobile-hero h2 {
    margin: 7px 0 5px;
    font-family: "Microsoft YaHei", sans-serif;
    font-size: 28px;
  }

  .mobile-hero p {
    margin: 0;
    font-size: 13px;
    opacity: 0.88;
  }

  .inventory-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
    margin-top: 17px;
    padding: 4px;
    border-radius: 14px;
    background: rgba(2, 46, 70, 0.24);
  }

  .inventory-tabs button {
    position: relative;
    z-index: 1;
    padding: 9px;
    border: 0;
    border-radius: 11px;
    color: rgba(255, 255, 255, 0.76);
    background: transparent;
    font-weight: 700;
  }

  .inventory-tabs button.active {
    color: #075e8f;
    background: #fff;
    box-shadow: 0 6px 15px rgba(0, 50, 77, 0.16);
  }

  .search-card,
  .inventory-card,
  .detail-card {
    border: 1px solid rgba(12, 99, 127, 0.11);
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 11px 28px rgba(30, 79, 90, 0.08);
  }

  .search-card {
    display: grid;
    gap: 9px;
    margin: 12px 0 15px;
    padding: 13px;
    border-radius: 20px;
  }

  .search-card /deep/ .el-select,
  .search-card /deep/ .el-input {
    width: 100%;
  }

  .search-card /deep/ .el-input__inner {
    border-color: #dbe9ec;
    border-radius: 11px;
  }

  .search-actions {
    display: grid;
    grid-template-columns: 0.72fr 1.28fr;
    gap: 9px;
  }

  .search-actions .el-button {
    width: 100%;
    margin: 0;
    border-radius: 11px;
  }

  .result-summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 5px 9px;
    color: #5b737c;
    font-size: 12px;
  }

  .result-summary strong {
    color: #0d789d;
  }

  .card-list {
    min-height: 180px;
  }

  .inventory-card {
    overflow: hidden;
    margin-bottom: 12px;
    border-radius: 21px;
    cursor: pointer;
  }

  .card-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
    padding: 16px 16px 11px;
  }

  .product-identity {
    min-width: 0;
  }

  .product-code {
    color: #0a719c;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.5px;
  }

  .product-identity h3 {
    margin: 4px 0 0;
    font-size: 15px;
    line-height: 1.35;
  }

  .price-badge {
    flex: none;
    padding: 7px 9px;
    border-radius: 12px;
    color: #a95500;
    text-align: right;
    background: #fff3df;
  }

  .price-badge strong,
  .price-badge span {
    display: block;
  }

  .price-badge strong {
    font-size: 13px;
  }

  .price-badge span {
    margin-top: 2px;
    font-size: 10px;
    opacity: 0.72;
  }

  .contract-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 16px;
    padding: 9px 11px;
    border-radius: 11px;
    color: #38616f;
    background: #edf7fa;
    font-size: 12px;
  }

  .contract-strip strong {
    overflow: hidden;
    color: #075e8f;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stock-amounts {
    display: grid;
    grid-template-columns: 1fr 1.25fr;
    gap: 9px;
    padding: 12px 16px 10px;
  }

  .stock-amounts > div {
    padding: 11px;
    border-radius: 13px;
    background: #f6f9f8;
  }

  .stock-amounts span {
    display: block;
    margin-bottom: 3px;
    color: #75888d;
    font-size: 11px;
  }

  .stock-amounts strong {
    color: #173f4c;
    font-size: 20px;
  }

  .stock-amounts em {
    margin-left: 3px;
    color: #74888d;
    font-size: 10px;
    font-style: normal;
  }

  .card-details,
  .detail-card dl {
    display: grid;
    gap: 7px;
    margin: 0;
  }

  .card-details {
    grid-template-columns: 1fr 1fr;
    padding: 0 16px 14px;
  }

  .card-details div,
  .detail-card dl div {
    min-width: 0;
  }

  .card-details dt,
  .detail-card dt {
    color: #84969b;
    font-size: 10px;
  }

  .card-details dd,
  .detail-card dd {
    overflow: hidden;
    margin: 2px 0 0;
    color: #38545d;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 16px;
    border-top: 1px solid #edf1f1;
    color: #0c779b;
    font-size: 12px;
    font-weight: 700;
  }

  .detail-head {
    display: grid;
    gap: 4px;
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 14px;
    color: #fff;
    background: linear-gradient(135deg, #075e8f, #2b9d9c);
  }

  .detail-head span,
  .detail-head em {
    font-size: 11px;
    font-style: normal;
    opacity: 0.86;
  }

  .detail-list {
    max-height: 58vh;
    min-height: 120px;
    overflow-y: auto;
  }

  .detail-card {
    margin-bottom: 10px;
    padding: 13px;
    border-radius: 16px;
  }

  .detail-card-top,
  .detail-stock {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .detail-card-top span {
    color: #6d858c;
    font-size: 11px;
  }

  .detail-card-top b {
    padding: 4px 7px;
    border-radius: 8px;
    font-size: 10px;
  }

  .detail-card-top b.safe { color: #087658; background: #e2f7ee; }
  .detail-card-top b.warning { color: #a85b00; background: #fff0d9; }
  .detail-card-top b.danger { color: #bd3030; background: #ffe8e8; }
  .detail-card-top b.neutral { color: #66777c; background: #edf1f2; }

  .detail-stock {
    margin: 10px 0;
    padding: 10px;
    border-radius: 11px;
    color: #0c7296;
    background: #eff8fa;
  }

  .detail-stock strong {
    font-size: 19px;
  }

  .detail-stock span {
    font-size: 13px;
    font-weight: 700;
  }

  .detail-card dl {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 480px) {
    .sales-inventory-mobile-page {
      min-height: 100vh;
      margin: -10px;
      padding-top: 10px;
    }
  }
</style>

<style>
  .sales-inventory-mobile-dropdown {
    z-index: 6000 !important;
    max-width: calc(100vw - 24px);
  }

  .sales-inventory-mobile-dropdown .el-select-dropdown__item {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sales-inventory-detail-dialog {
    max-width: 430px;
    margin-top: 8vh !important;
    border-radius: 20px;
  }

  .sales-inventory-detail-dialog .el-dialog__body {
    padding: 12px 14px 16px;
  }
</style>
