<template>
  <div class="mod-finance-summary">
    <section class="summary-hero">
      <div>
        <div class="summary-kicker">FINANCE TRACE</div>
        <h2>资方财务汇总</h2>
        <p>按确认函穿透查看销售合同、出库批次及资方还款进度</p>
      </div>
      <el-button icon="el-icon-refresh" :loading="funderLoading || confirmLoading" @click="refreshAll">刷新数据</el-button>
    </section>

    <el-tabs v-if="funderList.length" v-model="activeFunderId" type="card" class="funder-tabs" @tab-click="handleFunderChange">
      <el-tab-pane v-for="item in funderList" :key="item.funderId" :name="String(item.funderId)">
        <span slot="label" class="funder-tab-label">
          {{ item.funderName }}
          <em>{{ item.confirmCount || 0 }}</em>
        </span>
      </el-tab-pane>
    </el-tabs>

    <div v-if="currentFunder" class="metric-grid">
      <div class="metric-card metric-contract">
        <span>确认函合同</span>
        <strong>{{ currentFunder.confirmCount || 0 }}</strong>
        <small>当前资方关联合同数</small>
      </div>
      <div class="metric-card metric-loan">
        <span>累计贷款本金</span>
        <strong>¥{{ amount(currentFunder.loanAmount) }}</strong>
        <small>按历史贷款记录汇总</small>
      </div>
      <div class="metric-card metric-repaid">
        <span>已还本金</span>
        <strong>¥{{ amount(currentFunder.repaidPrincipal) }}</strong>
        <small>已确认还款本金</small>
      </div>
      <div class="metric-card metric-remaining">
        <span>剩余本金</span>
        <strong>¥{{ amount(currentFunder.remainingPrincipal) }}</strong>
        <small>{{ currentFunder.repaidBatchCount || 0 }} / {{ currentFunder.batchCount || 0 }} 个批次已还款</small>
      </div>
    </div>

    <section class="summary-panel">
      <el-form :inline="true" :model="queryForm" size="small" class="summary-query">
        <el-form-item>
          <el-input v-model.trim="queryForm.keyword" clearable placeholder="确认函/预售单/销售单/批次/客户" style="width:300px" @keyup.enter.native="getConfirmList"></el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.repaymentStatus" clearable placeholder="合同还款状态" style="width:150px">
            <el-option label="未还款" value="UNPAID"></el-option>
            <el-option label="部分还款" value="PARTIAL"></el-option>
            <el-option label="已结清" value="SETTLED"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item><el-button type="primary" icon="el-icon-search" @click="getConfirmList">查询</el-button></el-form-item>
        <el-form-item><el-button @click="resetQuery">重置</el-button></el-form-item>
      </el-form>

      <el-table
        :data="confirmList"
        row-key="confirmId"
        border
        stripe
        v-loading="confirmLoading"
        class="confirm-table"
        @expand-change="handleConfirmExpand">
        <el-table-column type="expand" width="48" fixed="left">
          <template slot-scope="confirmScope">
            <div class="level-wrap sale-level" v-loading="confirmScope.row.saleLoading">
              <div class="level-heading">
                <div><i class="el-icon-document"></i><strong>销售合同</strong><span>仅展示当前确认函、当前资方对应的销售库存</span></div>
                <el-tag size="mini" type="info">{{ (confirmScope.row.saleOrders || []).length }} 张</el-tag>
              </div>
              <el-table
                v-if="(confirmScope.row.saleOrders || []).length"
                :data="confirmScope.row.saleOrders"
                row-key="saleOrderId"
                border
                size="mini"
                class="sale-table"
                @expand-change="handleSaleExpand">
                <el-table-column type="expand" width="44" fixed="left">
                  <template slot-scope="saleScope">
                    <div class="level-wrap batch-level" v-loading="saleScope.row.batchLoading">
                      <div class="level-heading">
                        <div><i class="el-icon-truck"></i><strong>出库批次</strong><span>批次金额同时展示整批金额与当前确认函分摊金额</span></div>
                        <el-tag size="mini" type="info">{{ (saleScope.row.outboundBatches || []).length }} 个</el-tag>
                      </div>
                      <el-table v-if="(saleScope.row.outboundBatches || []).length" :data="saleScope.row.outboundBatches" border size="mini" class="batch-table">
                        <el-table-column prop="batchNo" label="出库批次号" min-width="145" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="outboundDate" label="出库日期" width="105" align="center">
                          <template slot-scope="scope">{{ dateOnly(scope.row.outboundDate) }}</template>
                        </el-table-column>
                        <el-table-column prop="warehouseNames" label="仓库" min-width="145" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="productCodes" label="产品编码" min-width="125" show-overflow-tooltip></el-table-column>
                        <el-table-column prop="shippedBoxes" label="箱数" width="75" align="right"></el-table-column>
                        <el-table-column label="重量(KG)" width="105" align="right">
                          <template slot-scope="scope">{{ weight(scope.row.shippedWeight) }}</template>
                        </el-table-column>
                        <el-table-column prop="funderName" label="资方" min-width="160" show-overflow-tooltip></el-table-column>
                        <el-table-column label="本确认函还本" width="125" align="right">
                          <template slot-scope="scope">¥{{ amount(scope.row.confirmPrincipalAmount) }}</template>
                        </el-table-column>
                        <el-table-column label="本确认函应付" width="125" align="right">
                          <template slot-scope="scope">¥{{ amount(scope.row.confirmExpectedPaymentAmount) }}</template>
                        </el-table-column>
                        <el-table-column label="批次总应付" width="120" align="right">
                          <template slot-scope="scope">¥{{ amount(scope.row.batchExpectedPaymentAmount) }}</template>
                        </el-table-column>
                        <el-table-column label="实际打款" width="115" align="right">
                          <template slot-scope="scope">¥{{ amount(scope.row.batchConfirmedPaymentAmount) }}</template>
                        </el-table-column>
                        <el-table-column label="还款日期" width="105" align="center">
                          <template slot-scope="scope">{{ dateOnly(scope.row.paymentDate || scope.row.repaymentDate) }}</template>
                        </el-table-column>
                        <el-table-column label="还款状态" width="120" align="center">
                          <template slot-scope="scope">
                            <el-tag :type="statusTag(scope.row.repaymentStatus)" size="mini">{{ scope.row.repaymentStatusName }}</el-tag>
                          </template>
                        </el-table-column>
                      </el-table>
                      <div v-else-if="saleScope.row.batchLoaded" class="level-empty">当前销售合同尚未产生该资方对应的出库批次</div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="saleOrderNo" label="销售单号" min-width="155" show-overflow-tooltip></el-table-column>
                <el-table-column prop="saleContractNo" label="销售合同号" min-width="145" show-overflow-tooltip></el-table-column>
                <el-table-column prop="customerName" label="客户/二批商" min-width="170" show-overflow-tooltip></el-table-column>
                <el-table-column prop="sellingEntityName" label="销售主体" min-width="170" show-overflow-tooltip></el-table-column>
                <el-table-column label="销售类型" width="85" align="center">
                  <template slot-scope="scope">{{ scope.row.saleType === 'FUTURES' ? '期货' : '现货' }}</template>
                </el-table-column>
                <el-table-column prop="warehouseNames" label="仓库" min-width="135" show-overflow-tooltip></el-table-column>
                <el-table-column prop="saleBoxes" label="销售箱数" width="90" align="right"></el-table-column>
                <el-table-column label="销售重量(KG)" width="115" align="right">
                  <template slot-scope="scope">{{ weight(scope.row.saleWeight) }}</template>
                </el-table-column>
                <el-table-column label="收款方式" width="90" align="center">
                  <template slot-scope="scope">{{ Number(scope.row.paymentMode) === 3 ? '内部结算' : (Number(scope.row.paymentMode) === 2 ? '全款' : '分批') }}</template>
                </el-table-column>
                <el-table-column label="批次进度" width="105" align="center">
                  <template slot-scope="scope">{{ scope.row.repaidBatchCount || 0 }}/{{ scope.row.batchCount || 0 }}</template>
                </el-table-column>
                <el-table-column label="还款状态" width="110" align="center">
                  <template slot-scope="scope">
                    <el-tag :type="statusTag(scope.row.repaymentStatus)" size="mini">{{ scope.row.repaymentStatusName }}</el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <div v-else-if="confirmScope.row.saleLoaded" class="level-empty">当前确认函尚未关联该资方货权的销售合同</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="145" show-overflow-tooltip></el-table-column>
        <el-table-column prop="presaleOrderNo" label="预售单号" min-width="145" show-overflow-tooltip></el-table-column>
        <el-table-column prop="businessEntityName" label="业务归属主体" min-width="170" show-overflow-tooltip></el-table-column>
        <el-table-column prop="buyerPartnerName" label="采购方" min-width="160" show-overflow-tooltip></el-table-column>
        <el-table-column prop="containerNo" label="柜号" min-width="125" show-overflow-tooltip></el-table-column>
        <el-table-column prop="temperatureZone" label="温区" width="80" align="center"></el-table-column>
        <el-table-column label="预计到港" width="105" align="center">
          <template slot-scope="scope">{{ dateOnly(scope.row.expectedArrivalDate) }}</template>
        </el-table-column>
        <el-table-column label="确认函金额" width="125" align="right">
          <template slot-scope="scope">¥{{ amount(scope.row.confirmTotalAmount) }}</template>
        </el-table-column>
        <el-table-column label="贷款本金" width="125" align="right">
          <template slot-scope="scope">¥{{ amount(scope.row.loanAmount) }}</template>
        </el-table-column>
        <el-table-column label="已还本金" width="120" align="right">
          <template slot-scope="scope">¥{{ amount(scope.row.repaidPrincipal) }}</template>
        </el-table-column>
        <el-table-column label="剩余本金" width="125" align="right">
          <template slot-scope="scope"><strong class="remaining-amount">¥{{ amount(scope.row.remainingPrincipal) }}</strong></template>
        </el-table-column>
        <el-table-column label="销售合同" width="90" align="center">
          <template slot-scope="scope">{{ scope.row.saleOrderCount || 0 }}张</template>
        </el-table-column>
        <el-table-column label="批次进度" width="100" align="center">
          <template slot-scope="scope">{{ scope.row.repaidBatchCount || 0 }}/{{ scope.row.batchCount || 0 }}</template>
        </el-table-column>
        <el-table-column label="还款状态" width="100" align="center">
          <template slot-scope="scope">
            <el-tag :type="statusTag(scope.row.repaymentStatus)" size="small">{{ scope.row.repaymentStatusName }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!confirmLoading && !confirmList.length" class="summary-empty">
        <i class="el-icon-folder-opened"></i>
        <strong>当前资方暂无符合条件的确认函</strong>
        <span>可调整查询条件，或确认该资方是否已生成贷款记录</span>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  data () {
    return {
      funderLoading: false,
      confirmLoading: false,
      funderList: [],
      activeFunderId: '',
      confirmList: [],
      queryForm: {
        keyword: '',
        repaymentStatus: ''
      }
    }
  },
  computed: {
    currentFunder () {
      return this.funderList.find(item => String(item.funderId) === String(this.activeFunderId)) || null
    }
  },
  activated () {
    this.getFunderList()
  },
  methods: {
    getFunderList () {
      this.funderLoading = true
      return this.$http({
        url: this.$http.adornUrl('/erp/finance-summary/funders'),
        method: 'get',
        params: this.$http.adornParams({})
      }).then(({ data }) => {
        if (!data || data.code !== 0) {
          return Promise.reject(new Error((data && data.msg) || '加载资方失败'))
        }
        this.funderList = data.list || []
        if (!this.funderList.some(item => String(item.funderId) === String(this.activeFunderId))) {
          this.activeFunderId = this.funderList.length ? String(this.funderList[0].funderId) : ''
        }
        return this.getConfirmList()
      }).catch(error => {
        this.$message.error(error.message || '加载资方失败，请检查后端服务')
      }).finally(() => {
        this.funderLoading = false
      })
    },
    getConfirmList () {
      if (!this.activeFunderId) {
        this.confirmList = []
        return Promise.resolve()
      }
      this.confirmLoading = true
      return this.$http({
        url: this.$http.adornUrl('/erp/finance-summary/confirms'),
        method: 'get',
        params: this.$http.adornParams({
          funderId: this.activeFunderId,
          keyword: this.queryForm.keyword,
          repaymentStatus: this.queryForm.repaymentStatus
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.confirmList = (data.list || []).map(item => Object.assign({}, item, {
            saleOrders: [],
            saleLoaded: false,
            saleLoading: false
          }))
        } else {
          this.confirmList = []
          this.$message.error((data && data.msg) || '加载财务汇总失败')
        }
      }).catch(() => {
        this.confirmList = []
        this.$message.error('加载财务汇总失败，请检查后端服务')
      }).finally(() => {
        this.confirmLoading = false
      })
    },
    handleFunderChange () {
      this.getConfirmList()
    },
    handleConfirmExpand (row, expandedRows) {
      if (!this.isExpanded(row, expandedRows, 'confirmId') || row.saleLoaded || row.saleLoading) return
      this.$set(row, 'saleLoading', true)
      this.$http({
        url: this.$http.adornUrl('/erp/finance-summary/sale-orders'),
        method: 'get',
        params: this.$http.adornParams({ funderId: this.activeFunderId, confirmId: row.confirmId })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$set(row, 'saleOrders', (data.list || []).map(item => Object.assign({}, item, {
            confirmId: row.confirmId,
            outboundBatches: [],
            batchLoaded: false,
            batchLoading: false
          })))
          this.$set(row, 'saleLoaded', true)
        } else {
          this.$message.error((data && data.msg) || '加载销售合同失败')
        }
      }).catch(() => this.$message.error('加载销售合同失败，请检查后端服务')).finally(() => {
        this.$set(row, 'saleLoading', false)
      })
    },
    handleSaleExpand (row, expandedRows) {
      if (!this.isExpanded(row, expandedRows, 'saleOrderId') || row.batchLoaded || row.batchLoading) return
      this.$set(row, 'batchLoading', true)
      this.$http({
        url: this.$http.adornUrl('/erp/finance-summary/outbound-batches'),
        method: 'get',
        params: this.$http.adornParams({
          funderId: this.activeFunderId,
          confirmId: row.confirmId,
          saleOrderId: row.saleOrderId
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.$set(row, 'outboundBatches', data.list || [])
          this.$set(row, 'batchLoaded', true)
        } else {
          this.$message.error((data && data.msg) || '加载出库批次失败')
        }
      }).catch(() => this.$message.error('加载出库批次失败，请检查后端服务')).finally(() => {
        this.$set(row, 'batchLoading', false)
      })
    },
    isExpanded (row, expandedRows, key) {
      if (Array.isArray(expandedRows)) {
        return expandedRows.some(item => String(item[key]) === String(row[key]))
      }
      return Boolean(expandedRows)
    },
    refreshAll () {
      this.getFunderList()
    },
    resetQuery () {
      this.queryForm = { keyword: '', repaymentStatus: '' }
      this.getConfirmList()
    },
    amount (value) {
      return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    weight (value) {
      return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
    },
    dateOnly (value) {
      return value ? String(value).slice(0, 10) : '-'
    },
    statusTag (status) {
      const map = {
        SETTLED: 'success',
        PARTIAL: 'warning',
        UNPAID: 'danger',
        NO_BATCH: 'info',
        PENDING_PAYMENT: 'warning',
        PENDING_CONFIRM: 'warning',
        PENDING_RECONCILIATION: 'danger',
        OUTBOUND_PENDING_CONFIRM: 'warning',
        OUTBOUND_PENDING_BANK: 'warning',
        OUTBOUND_PENDING_RECEIPT: 'info'
      }
      return map[status] || 'info'
    }
  }
}
</script>

<style lang="scss">
.mod-finance-summary {
  --finance-ink: #17335c;
  --finance-blue: #1768a8;
  --finance-cyan: #1aa7a1;
  --finance-line: #dbe6ef;
  min-height: calc(100vh - 110px);
  color: #26384d;

  .summary-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 26px;
    margin-bottom: 18px;
    overflow: hidden;
    border-radius: 10px;
    color: #fff;
    background:
      radial-gradient(circle at 78% 25%, rgba(255, 255, 255, .18), transparent 24%),
      linear-gradient(118deg, #12345f 0%, #176aa7 58%, #1aa7a1 100%);
    box-shadow: 0 10px 28px rgba(24, 76, 119, .18);
  }
  .summary-hero h2 { margin: 3px 0 6px; font-size: 24px; letter-spacing: 1px; }
  .summary-hero p { margin: 0; color: rgba(255, 255, 255, .78); }
  .summary-kicker { font-size: 11px; font-weight: 700; letter-spacing: 3px; color: #8ee4dd; }
  .summary-hero .el-button { border-color: rgba(255, 255, 255, .56); color: #fff; background: rgba(255, 255, 255, .12); }

  .funder-tabs { margin-bottom: 16px; }
  .funder-tabs > .el-tabs__header { margin-bottom: 0; }
  .funder-tabs .el-tabs__item { height: 44px; line-height: 44px; background: #fff; }
  .funder-tabs .el-tabs__item.is-active { color: var(--finance-blue); background: #f1f8fc; border-bottom-color: #f1f8fc; }
  .funder-tab-label em {
    display: inline-flex;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    margin-left: 7px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    line-height: 20px;
    font-style: normal;
    color: #fff;
    background: var(--finance-cyan);
  }

  .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
  .metric-card {
    position: relative;
    min-height: 112px;
    padding: 17px 18px;
    overflow: hidden;
    border: 1px solid var(--finance-line);
    border-radius: 9px;
    background: #fff;
    box-shadow: 0 4px 14px rgba(34, 67, 96, .06);
  }
  .metric-card::after { content: ''; position: absolute; right: -16px; bottom: -28px; width: 90px; height: 90px; border-radius: 50%; opacity: .09; background: currentColor; }
  .metric-card span { display: block; font-size: 13px; color: #718296; }
  .metric-card strong { display: block; margin: 8px 0 5px; font-size: 23px; color: var(--finance-ink); }
  .metric-card small { color: #93a2b2; }
  .metric-contract { color: #1768a8; border-top: 3px solid #1768a8; }
  .metric-loan { color: #1a8ca6; border-top: 3px solid #1a8ca6; }
  .metric-repaid { color: #1b9b78; border-top: 3px solid #1b9b78; }
  .metric-remaining { color: #e08b35; border-top: 3px solid #e08b35; }

  .summary-panel { padding: 18px; border: 1px solid var(--finance-line); border-radius: 9px; background: #fff; }
  .summary-query { margin-bottom: 8px; }
  .confirm-table .el-table__expanded-cell { padding: 13px 16px 16px 58px; background: #f4f8fb; }
  .sale-table .el-table__expanded-cell { padding: 12px 14px 14px 48px; background: #edf4f8; }
  .level-wrap { position: relative; min-height: 62px; border-left: 3px solid var(--finance-cyan); }
  .batch-level { border-left-color: var(--finance-blue); }
  .level-heading { display: flex; align-items: center; justify-content: space-between; margin: 0 0 10px; padding: 8px 12px; color: var(--finance-ink); background: rgba(255, 255, 255, .78); }
  .level-heading i { margin-right: 7px; color: var(--finance-cyan); }
  .batch-level .level-heading i { color: var(--finance-blue); }
  .level-heading span { margin-left: 12px; font-size: 12px; color: #8493a4; font-weight: normal; }
  .level-empty { padding: 24px; text-align: center; color: #8a99aa; background: rgba(255, 255, 255, .72); }
  .remaining-amount { color: #dc6b34; }
  .summary-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; color: #8999aa; }
  .summary-empty i { margin-bottom: 12px; font-size: 42px; color: #b8c8d6; }
  .summary-empty strong { margin-bottom: 7px; color: #53677d; }
  .summary-empty span { font-size: 12px; }

  @media (max-width: 1100px) {
    .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
}
</style>
