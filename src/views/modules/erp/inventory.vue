<template>
  <div class="mod-erp-inventory">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <el-tab-pane label="现货库存" name="spot">
        <el-form :inline="true" :model="spotQuery" size="small">
          <el-form-item>
            <el-input v-model="spotQuery.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="spotQuery.contractNo" placeholder="合同号" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="spotQuery.warehouseId" filterable clearable placeholder="请选择仓库" style="width: 190px;" @change="spotWarehouseChange">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="spotQuery.containerNos"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              :disabled="!spotQuery.warehouseId"
              :loading="spotContainerLoading"
              :remote-method="remoteSearchSpotContainers"
              placeholder="请选择柜号"
              style="width: 260px;">
              <el-option v-for="item in spotContainerOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="spotQuery.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getSpotList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="spotQuery.onlyAvailable" true-label="1" false-label="0">只看可售库存</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getSpotList()">查询</el-button>
            <el-button @click="resetSpotQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="spotList" border stripe v-loading="spotLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="涉及合同号" min-width="190" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatContractNos(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="packingBoxes" label="装箱单箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="inboundBoxes" label="入库箱数" width="100" align="right" header-align="center"></el-table-column>
          <el-table-column prop="allocatedBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableBoxes" label="可售箱数" width="100" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-danger': Number(scope.row.availableBoxes) < 0 }">{{ scope.row.availableBoxes }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="inboundWeightKg" label="入库总重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="allocatedWeightKg" label="已占用重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="调整标识" width="100" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshToFrozenFlag" size="small" type="danger">鲜转冻</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('spot', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="期货库存" name="futures">
        <el-form :inline="true" :model="futuresQuery" size="small">
          <el-form-item>
            <el-input v-model="futuresQuery.keyword" placeholder="产品编码/中文名/英文名" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="futuresQuery.contractNo" placeholder="合同号" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="futuresQuery.warehouseId" filterable clearable placeholder="请选择仓库" style="width: 190px;" @change="futuresWarehouseChange">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="futuresQuery.containerNos"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              :disabled="!futuresQuery.warehouseId"
              :loading="futuresContainerLoading"
              :remote-method="remoteSearchFuturesContainers"
              placeholder="请选择柜号"
              style="width: 260px;">
              <el-option v-for="item in futuresContainerOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="futuresQuery.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getFuturesList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="futuresQuery.onlyAvailable" true-label="1" false-label="0">只看期货可售</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getFuturesList()">查询</el-button>
            <el-button @click="resetFuturesQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="futuresList" border stripe v-loading="futuresLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="涉及合同号" min-width="190" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatContractNos(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="futuresBoxes" label="期货总箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresSoldBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresAvailableBoxes" label="期货可售箱数" width="120" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-danger': Number(scope.row.futuresAvailableBoxes) < 0 }">{{ scope.row.futuresAvailableBoxes }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="totalWeightKg" label="期货总重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="soldWeightKg" label="已销售重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="期货可售重量(KG)" width="145" align="right" header-align="center"></el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('futures', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="出入库记录" name="records">
        <el-form :inline="true" :model="recordQuery" size="small">
          <el-form-item>
            <el-input v-model="recordQuery.keyword" placeholder="产品/单号/客户" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.recordType" clearable placeholder="记录类型" style="width: 120px;">
              <el-option label="入库" value="INBOUND"></el-option>
              <el-option label="出库" value="OUTBOUND"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.contractNo" placeholder="合同号" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.warehouseName" placeholder="仓库" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.containerNo" placeholder="柜号" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-input v-model="recordQuery.factoryNo" placeholder="厂号" clearable @keyup.enter.native="getRecordList()"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRecordList()">查询</el-button>
            <el-button @click="resetRecordQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="recordList" border stripe v-loading="recordLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column label="类型" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag :type="scope.row.recordType === 'INBOUND' ? 'success' : 'warning'" size="small">{{ scope.row.recordTypeName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bizDate" label="日期" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.bizDate) }}</template>
          </el-table-column>
          <el-table-column prop="orderNo" label="单号" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="boxes" label="箱数" width="90" align="right" header-align="center"></el-table-column>
          <el-table-column prop="weightKg" label="重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80" align="center" header-align="center"></el-table-column>
          <el-table-column prop="sourceRemark" label="来源" width="100" align="center" header-align="center"></el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      :title="batchDialogTitle"
      :visible.sync="batchDialogVisible"
      width="92vw"
      custom-class="inventory-batch-dialog"
      append-to-body>
      <div v-if="currentInventoryRow" class="batch-summary">
        <span>产品编码：{{ currentInventoryRow.productCode || '-' }}</span>
        <span>产品名称：{{ currentInventoryRow.productName || '-' }}</span>
        <span>货权：{{ currentInventoryRow.ownershipName || '-' }}</span>
      </div>
      <el-table :data="batchList" border stripe v-loading="batchLoading" height="430">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <template v-if="currentBatchType === 'spot'">
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customerName" label="客户" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="temperatureZone" label="温区" width="90" align="center" header-align="center"></el-table-column>
          <el-table-column label="调整标识" width="100" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshToFrozenFlag" size="small" type="danger">鲜转冻</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="skuCode" label="SKU" min-width="170" show-overflow-tooltip></el-table-column>
        </template>
        <template v-else>
          <el-table-column prop="presaleOrderNo" label="预销售单" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="customerReference" label="采购方" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="brandName" label="品牌方" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="expectedArrivalDate" label="预计到港" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.expectedArrivalDate) }}</template>
          </el-table-column>
        </template>
        <el-table-column prop="productionDate" label="生产日期" width="115" align="center" header-align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.productionDate) }}</template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="过期日期" width="115" align="center" header-align="center">
          <template slot-scope="scope">{{ formatDate(scope.row.expiryDate) }}</template>
        </el-table-column>
        <template v-if="currentBatchType === 'spot'">
          <el-table-column prop="packingBoxes" label="装箱单箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="inboundBoxes" label="入库箱数" width="100" align="right" header-align="center"></el-table-column>
          <el-table-column prop="allocatedBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableBoxes" label="可售箱数" width="100" align="right" header-align="center"></el-table-column>
          <el-table-column prop="inboundWeightKg" label="入库重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="allocatedWeightKg" label="已占用重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="120" align="right" header-align="center"></el-table-column>
        </template>
        <template v-else>
          <el-table-column prop="futuresBoxes" label="期货箱数" width="100" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresSoldBoxes" label="已占用箱数" width="110" align="right" header-align="center"></el-table-column>
          <el-table-column prop="futuresAvailableBoxes" label="期货可售箱数" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="totalWeightKg" label="期货重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column prop="soldWeightKg" label="已销售重量(KG)" width="135" align="right" header-align="center"></el-table-column>
          <el-table-column prop="availableWeightKg" label="期货可售重量(KG)" width="145" align="right" header-align="center"></el-table-column>
        </template>
        <el-table-column label="预警" min-width="100" align="center" header-align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        activeTab: 'spot',
        warehouseList: [],
        spotContainerOptions: [],
        futuresContainerOptions: [],
        spotQuery: {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        },
        futuresQuery: {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '0'
        },
        recordQuery: {
          keyword: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        },
        spotList: [],
        futuresList: [],
        recordList: [],
        batchList: [],
        spotLoading: false,
        futuresLoading: false,
        spotContainerLoading: false,
        futuresContainerLoading: false,
        recordLoading: false,
        batchLoading: false,
        batchDialogVisible: false,
        batchDialogTitle: '库存批次详情',
        currentBatchType: 'spot',
        currentInventoryRow: null
      }
    },
    activated () {
      this.loadWarehouses()
      this.getDataList()
    },
    methods: {
      handleTabChange () {
        this.getDataList()
      },
      getDataList () {
        if (this.activeTab === 'futures') {
          this.getFuturesList()
        } else if (this.activeTab === 'records') {
          this.getRecordList()
        } else {
          this.getSpotList()
        }
      },
      getSpotList () {
        this.spotLoading = true
        const params = Object.assign({}, this.spotQuery, {
          containerNos: this.spotQuery.containerNos.join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/spot'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.spotList = data.list || []
          } else {
            this.spotList = []
            this.$message.error((data && data.msg) || '获取现货库存失败')
          }
          this.spotLoading = false
        }).catch(() => {
          this.spotLoading = false
        })
      },
      getFuturesList () {
        this.futuresLoading = true
        const params = Object.assign({}, this.futuresQuery, {
          containerNos: this.futuresQuery.containerNos.join(',')
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/futures'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.futuresList = data.list || []
          } else {
            this.futuresList = []
            this.$message.error((data && data.msg) || '获取期货库存失败')
          }
          this.futuresLoading = false
        }).catch(() => {
          this.futuresLoading = false
        })
      },
      getRecordList () {
        this.recordLoading = true
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/records'),
          method: 'get',
          params: this.$http.adornParams(this.recordQuery)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.recordList = data.list || []
          } else {
            this.recordList = []
            this.$message.error((data && data.msg) || '获取出入库记录失败')
          }
          this.recordLoading = false
        }).catch(() => {
          this.recordLoading = false
        })
      },
      openBatchDialog (type, row) {
        this.currentInventoryRow = row
        this.currentBatchType = type
        this.batchList = []
        this.batchDialogTitle = type === 'futures' ? '期货库存来源详情' : '现货库存来源详情'
        this.batchDialogVisible = true
        this.batchLoading = true
        const url = type === 'futures' ? '/erp/inventory/futures/batches' : '/erp/inventory/spot/batches'
        const params = type === 'futures'
          ? {
            productId: row.productId,
            warehouseId: this.futuresQuery.warehouseId,
            contractNo: this.futuresQuery.contractNo,
            containerNos: (this.futuresQuery.containerNos || []).join(','),
            ownershipName: row.ownershipName || '',
            factoryNo: this.futuresQuery.factoryNo,
            onlyAvailable: this.futuresQuery.onlyAvailable
          }
          : {
            productId: row.productId,
            warehouseId: this.spotQuery.warehouseId,
            contractNo: this.spotQuery.contractNo,
            containerNos: (this.spotQuery.containerNos || []).join(','),
            ownershipName: row.ownershipName || '',
            factoryNo: this.spotQuery.factoryNo,
            onlyAvailable: this.spotQuery.onlyAvailable
          }
        this.$http({
          url: this.$http.adornUrl(url),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.batchList = data.list || []
          } else {
            this.batchList = []
            this.$message.error((data && data.msg) || '获取库存批次失败')
          }
          this.batchLoading = false
        }).catch(() => {
          this.batchLoading = false
        })
      },
      resetSpotQuery () {
        this.spotQuery = {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        }
        this.spotContainerOptions = []
        this.spotList = []
        this.getSpotList()
      },
      resetFuturesQuery () {
        this.futuresQuery = {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '0'
        }
        this.futuresContainerOptions = []
        this.futuresList = []
        this.getFuturesList()
      },
      resetRecordQuery () {
        this.recordQuery = {
          keyword: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        }
        this.getRecordList()
      },
      formatContractNos (row) {
        if (!row) return '-'
        if (row.contractNo) return row.contractNo
        if (row.contractNos) return row.contractNos
        return '-'
      },
      loadWarehouses () {
        this.$http({
          url: this.$http.adornUrl('/erp/warehouse/select'),
          method: 'get',
          params: this.$http.adornParams()
        }).then(({data}) => {
          this.warehouseList = (data && data.list) || []
        })
      },
      spotWarehouseChange () {
        this.spotQuery.containerNos = []
        this.spotContainerOptions = []
        this.spotList = []
        this.remoteSearchSpotContainers('')
      },
      futuresWarehouseChange () {
        this.futuresQuery.containerNos = []
        this.futuresContainerOptions = []
        this.futuresList = []
        this.remoteSearchFuturesContainers('')
      },
      remoteSearchSpotContainers (keyword) {
        this.remoteSearchContainers('spot', keyword)
      },
      remoteSearchFuturesContainers (keyword) {
        this.remoteSearchContainers('futures', keyword)
      },
      remoteSearchContainers (inventoryType, keyword) {
        const isFutures = inventoryType === 'futures'
        const query = isFutures ? this.futuresQuery : this.spotQuery
        if (!query.warehouseId) {
          if (isFutures) {
            this.futuresContainerOptions = []
          } else {
            this.spotContainerOptions = []
          }
          return
        }
        if (isFutures) {
          this.futuresContainerLoading = true
        } else {
          this.spotContainerLoading = true
        }
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/containers'),
          method: 'get',
          params: this.$http.adornParams({
            inventoryType: inventoryType,
            warehouseId: query.warehouseId,
            keyword: keyword || ''
          })
        }).then(({data}) => {
          const list = (data && data.list) || []
          const selected = query.containerNos || []
          const options = Array.from(new Set(selected.concat(list)))
          if (isFutures) {
            this.futuresContainerOptions = options
            this.futuresContainerLoading = false
          } else {
            this.spotContainerOptions = options
            this.spotContainerLoading = false
          }
        }).catch(() => {
          if (isFutures) {
            this.futuresContainerLoading = false
          } else {
            this.spotContainerLoading = false
          }
        })
      },
      formatDate (value) {
        if (!value) return ''
        const text = String(value)
        if (text.length >= 10) return text.substring(0, 10)
        return text
      }
    }
  }
</script>

<style scoped>
  .mod-erp-inventory .el-form {
    margin-bottom: 12px;
  }

  .inventory-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .batch-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f6f8fa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
    color: #303133;
  }

  /deep/ .inventory-batch-dialog {
    max-width: 1480px;
  }
</style>
