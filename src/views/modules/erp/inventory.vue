<template>
  <div class="mod-erp-inventory">
    <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabChange">
      <el-tab-pane label="现货库存" name="spot">
        <el-form :inline="true" :model="spotQuery" size="small">
          <el-form-item>
            <el-select v-model="spotQuery.keyword" filterable remote clearable reserve-keyword placeholder="请选择产品"
              :remote-method="keyword => remoteInventoryOption('spot', 'product', keyword)" :loading="inventoryOptionLoading('spot', 'product')"
              @visible-change="visible => openInventoryOption('spot', 'product', visible)">
              <el-option v-for="item in inventoryOptionList('spot', 'product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="spotQuery.contractNo" filterable remote clearable reserve-keyword placeholder="请选择合同号"
              :remote-method="keyword => remoteInventoryOption('spot', 'contract', keyword)" :loading="inventoryOptionLoading('spot', 'contract')"
              @visible-change="visible => openInventoryOption('spot', 'contract', visible)">
              <el-option v-for="item in inventoryOptionList('spot', 'contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
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
            <el-select v-model="spotQuery.factoryNo" filterable remote clearable reserve-keyword placeholder="请选择厂号"
              :remote-method="keyword => remoteInventoryOption('spot', 'factory', keyword)" :loading="inventoryOptionLoading('spot', 'factory')"
              @visible-change="visible => openInventoryOption('spot', 'factory', visible)">
              <el-option v-for="item in inventoryOptionList('spot', 'factory')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
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
          <el-table-column label="鲜转冻标识" width="150" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="isAllFreshToFrozen(scope.row)" size="small" type="danger">全部鲜转冻</el-tag>
              <div v-else-if="isPartialFreshToFrozen(scope.row)" class="fresh-frozen-cell">
                <el-tag size="small" type="warning">部分鲜转冻</el-tag>
                <div class="fresh-frozen-summary">
                  {{ scope.row.freshToFrozenBoxes || 0 }}件 / {{ formatWeight(scope.row.freshToFrozenWeightKg) }}KG
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="涉及合同号" min-width="190" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatContractNos(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属主体" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="earliestInboundDate" label="最早入库" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.earliestInboundDate || scope.row.inboundDate) }}</template>
          </el-table-column>
          <el-table-column prop="latestInboundDate" label="最近入库" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.latestInboundDate || scope.row.inboundDate) }}</template>
          </el-table-column>
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
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-damage': Number(scope.row.damageWeightKg || 0) > 0 }">{{ formatWeight(scope.row.damageWeightKg) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="damageReason" label="报损原因" min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('spot', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="柜号产品库存" name="spotContainerProduct">
        <el-form :inline="true" :model="spotContainerProductQuery" size="small">
          <el-form-item>
            <el-select v-model="spotContainerProductQuery.keyword" filterable remote clearable reserve-keyword placeholder="请选择产品"
              :remote-method="keyword => remoteInventoryOption('spotContainerProduct', 'product', keyword)" :loading="inventoryOptionLoading('spotContainerProduct', 'product')"
              @visible-change="visible => openInventoryOption('spotContainerProduct', 'product', visible)">
              <el-option v-for="item in inventoryOptionList('spotContainerProduct', 'product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="spotContainerProductQuery.contractNo" filterable remote clearable reserve-keyword placeholder="请选择合同号"
              :remote-method="keyword => remoteInventoryOption('spotContainerProduct', 'contract', keyword)" :loading="inventoryOptionLoading('spotContainerProduct', 'contract')"
              @visible-change="visible => openInventoryOption('spotContainerProduct', 'contract', visible)">
              <el-option v-for="item in inventoryOptionList('spotContainerProduct', 'contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="spotContainerProductQuery.warehouseId" filterable clearable placeholder="请选择仓库" style="width: 190px;" @change="spotContainerProductWarehouseChange">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="spotContainerProductQuery.containerNos"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              :disabled="!spotContainerProductQuery.warehouseId"
              :loading="spotContainerProductContainerLoading"
              :remote-method="remoteSearchSpotContainerProductContainers"
              placeholder="请选择柜号"
              style="width: 260px;">
              <el-option v-for="item in spotContainerProductContainerOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="spotContainerProductQuery.factoryNo" filterable remote clearable reserve-keyword placeholder="请选择厂号"
              :remote-method="keyword => remoteInventoryOption('spotContainerProduct', 'factory', keyword)" :loading="inventoryOptionLoading('spotContainerProduct', 'factory')"
              @visible-change="visible => openInventoryOption('spotContainerProduct', 'factory', visible)">
              <el-option v-for="item in inventoryOptionList('spotContainerProduct', 'factory')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-date-picker
              class="inventory-date-range"
              v-model="spotContainerProductInboundDateRange"
              type="daterange"
              value-format="yyyy-MM-dd"
              range-separator="至"
              start-placeholder="入库开始"
              end-placeholder="入库结束"
              @change="getSpotContainerProductList()">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="spotContainerProductQuery.onlyAvailable" true-label="1" false-label="0">只看可售库存</el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getSpotContainerProductList()">查询</el-button>
            <el-button @click="resetSpotContainerProductQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="spotContainerProductList" border stripe v-loading="spotContainerProductLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column label="确认函合同号" min-width="170" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatContractNos(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属主体" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="temperatureZone" label="温区" width="90" align="center" header-align="center"></el-table-column>
          <el-table-column prop="inboundDate" label="入库时间" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.inboundDate) }}</template>
          </el-table-column>
          <el-table-column prop="factoryNos" label="厂号汇总" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column label="鲜转冻标识" width="150" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="isAllFreshToFrozen(scope.row)" size="small" type="danger">全部鲜转冻</el-tag>
              <div v-else-if="isPartialFreshToFrozen(scope.row)" class="fresh-frozen-cell">
                <el-tag size="small" type="warning">部分鲜转冻</el-tag>
                <div class="fresh-frozen-summary">
                  {{ scope.row.freshToFrozenBoxes || 0 }}件 / {{ formatWeight(scope.row.freshToFrozenWeightKg) }}KG
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>
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
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-damage': Number(scope.row.damageWeightKg || 0) > 0 }">{{ formatWeight(scope.row.damageWeightKg) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="damageReason" label="报损原因" min-width="200" show-overflow-tooltip></el-table-column>
          <el-table-column prop="availableWeightKg" label="可售重量(KG)" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column label="预警" width="90" align="center" header-align="center">
            <template slot-scope="scope">
              <el-tag v-if="scope.row.freshnessWarning" size="small" type="warning">保鲜</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openBatchDialog('spotContainerProduct', scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="加权单价报告" name="weightedCost">
        <el-form :inline="true" :model="weightedCostQuery" size="small">
          <el-form-item>
            <el-select v-model="weightedCostQuery.keyword" filterable remote clearable reserve-keyword placeholder="请选择产品"
              :remote-method="keyword => remoteInventoryOption('weightedCost', 'product', keyword)" :loading="inventoryOptionLoading('weightedCost', 'product')"
              @visible-change="visible => openInventoryOption('weightedCost', 'product', visible)">
              <el-option v-for="item in inventoryOptionList('weightedCost', 'product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="weightedCostQuery.contractNo" filterable remote clearable reserve-keyword placeholder="请选择合同号"
              :remote-method="keyword => remoteInventoryOption('weightedCost', 'contract', keyword)" :loading="inventoryOptionLoading('weightedCost', 'contract')"
              @visible-change="visible => openInventoryOption('weightedCost', 'contract', visible)">
              <el-option v-for="item in inventoryOptionList('weightedCost', 'contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="weightedCostQuery.warehouseId" filterable clearable placeholder="请选择仓库" style="width: 190px;" @change="weightedCostWarehouseChange">
              <el-option v-for="item in warehouseList" :key="item.id" :label="item.warehouseName" :value="item.id"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select
              v-model="weightedCostQuery.containerNos"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              :disabled="!weightedCostQuery.warehouseId"
              :loading="weightedCostContainerLoading"
              :remote-method="remoteSearchWeightedCostContainers"
              placeholder="请选择柜号"
              style="width: 260px;">
              <el-option v-for="item in weightedCostContainerOptions" :key="item" :label="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="weightedCostQuery.factoryNo" filterable remote clearable reserve-keyword placeholder="请选择厂号"
              :remote-method="keyword => remoteInventoryOption('weightedCost', 'factory', keyword)" :loading="inventoryOptionLoading('weightedCost', 'factory')"
              @visible-change="visible => openInventoryOption('weightedCost', 'factory', visible)">
              <el-option v-for="item in inventoryOptionList('weightedCost', 'factory')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-date-picker
              class="inventory-date-range"
              v-model="weightedCostInboundDateRange"
              type="daterange"
              value-format="yyyy-MM-dd"
              range-separator="至"
              start-placeholder="入库开始"
              end-placeholder="入库结束"
              @change="getWeightedCostList()">
            </el-date-picker>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getWeightedCostList()">查询</el-button>
            <el-button @click="resetWeightedCostQuery()">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table :data="weightedCostList" border stripe v-loading="weightedCostLoading" height="620">
          <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="110" align="center" header-align="center"></el-table-column>
          <el-table-column prop="productName" label="中文名称" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column label="涉及合同号" min-width="190" show-overflow-tooltip>
            <template slot-scope="scope">{{ formatContractNos(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属主体" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
          <el-table-column prop="availableBoxes" label="当前剩余箱数" width="120" align="right" header-align="center"></el-table-column>
          <el-table-column label="当前剩余重量(KG)" width="145" align="right" header-align="center">
            <template slot-scope="scope">{{ numberText(scope.row.availableWeightKg, 3) }}</template>
          </el-table-column>
          <el-table-column label="加权平均单价" width="135" align="right" header-align="center">
            <template slot-scope="scope">{{ numberText(scope.row.weightedUnitPrice, 6) }}</template>
          </el-table-column>
          <el-table-column label="加权采购金额" width="135" align="right" header-align="center">
            <template slot-scope="scope">{{ numberText(scope.row.purchaseAmount, 2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="90" align="center" header-align="center" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="openWeightedCostDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="期货库存" name="futures">
        <el-form :inline="true" :model="futuresQuery" size="small">
          <el-form-item>
            <el-select v-model="futuresQuery.keyword" filterable remote clearable reserve-keyword placeholder="请选择产品"
              :remote-method="keyword => remoteInventoryOption('futures', 'product', keyword)" :loading="inventoryOptionLoading('futures', 'product')"
              @visible-change="visible => openInventoryOption('futures', 'product', visible)">
              <el-option v-for="item in inventoryOptionList('futures', 'product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="futuresQuery.contractNo" filterable remote clearable reserve-keyword placeholder="请选择合同号"
              :remote-method="keyword => remoteInventoryOption('futures', 'contract', keyword)" :loading="inventoryOptionLoading('futures', 'contract')"
              @visible-change="visible => openInventoryOption('futures', 'contract', visible)">
              <el-option v-for="item in inventoryOptionList('futures', 'contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
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
            <el-select v-model="futuresQuery.factoryNo" filterable remote clearable reserve-keyword placeholder="请选择厂号"
              :remote-method="keyword => remoteInventoryOption('futures', 'factory', keyword)" :loading="inventoryOptionLoading('futures', 'factory')"
              @visible-change="visible => openInventoryOption('futures', 'factory', visible)">
              <el-option v-for="item in inventoryOptionList('futures', 'factory')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
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

      <el-tab-pane label="预售单库存" name="presale">
        <presale-inventory embedded></presale-inventory>
      </el-tab-pane>

      <el-tab-pane label="出入库记录" name="records">
        <el-form :inline="true" :model="recordQuery" size="small">
          <el-form-item>
            <el-select v-model="recordQuery.productKeyword" filterable remote clearable reserve-keyword placeholder="请选择产品"
              :remote-method="keyword => remoteInventoryOption('records', 'product', keyword)" :loading="inventoryOptionLoading('records', 'product')"
              @visible-change="visible => openInventoryOption('records', 'product', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'product')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.orderNo" filterable remote clearable reserve-keyword placeholder="请选择单号"
              :remote-method="keyword => remoteInventoryOption('records', 'order', keyword)" :loading="inventoryOptionLoading('records', 'order')"
              @visible-change="visible => openInventoryOption('records', 'order', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'order')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.customerName" filterable remote clearable reserve-keyword placeholder="请选择客户"
              :remote-method="keyword => remoteInventoryOption('records', 'customer', keyword)" :loading="inventoryOptionLoading('records', 'customer')"
              @visible-change="visible => openInventoryOption('records', 'customer', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'customer')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.recordType" clearable placeholder="记录类型" style="width: 120px;">
              <el-option label="入库" value="INBOUND"></el-option>
              <el-option label="出库" value="OUTBOUND"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.contractNo" filterable remote clearable reserve-keyword placeholder="请选择合同号"
              :remote-method="keyword => remoteInventoryOption('records', 'contract', keyword)" :loading="inventoryOptionLoading('records', 'contract')"
              @visible-change="visible => openInventoryOption('records', 'contract', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'contract')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.warehouseName" filterable remote clearable reserve-keyword placeholder="请选择仓库"
              :remote-method="keyword => remoteInventoryOption('records', 'warehouse', keyword)" :loading="inventoryOptionLoading('records', 'warehouse')"
              @change="recordWarehouseChange"
              @visible-change="visible => openInventoryOption('records', 'warehouse', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'warehouse')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.containerNo" filterable remote clearable reserve-keyword placeholder="请选择柜号"
              :remote-method="keyword => remoteInventoryOption('records', 'container', keyword)" :loading="inventoryOptionLoading('records', 'container')"
              @visible-change="visible => openInventoryOption('records', 'container', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'container')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-select v-model="recordQuery.factoryNo" filterable remote clearable reserve-keyword placeholder="请选择厂号"
              :remote-method="keyword => remoteInventoryOption('records', 'factory', keyword)" :loading="inventoryOptionLoading('records', 'factory')"
              @visible-change="visible => openInventoryOption('records', 'factory', visible)">
              <el-option v-for="item in inventoryOptionList('records', 'factory')" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
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
        <span>业务归属：{{ currentInventoryRow.businessEntityName || '-' }}</span>
        <span>货权：{{ currentInventoryRow.ownershipName || '-' }}</span>
      </div>
      <el-table :data="batchList" border stripe v-loading="batchLoading" height="430">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <template v-if="currentBatchType === 'spot'">
          <el-table-column prop="warehouseName" label="仓库" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属主体" min-width="180" show-overflow-tooltip></el-table-column>
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
          <el-table-column prop="inboundDate" label="入库时间" width="115" align="center" header-align="center">
            <template slot-scope="scope">{{ formatDate(scope.row.inboundDate) }}</template>
          </el-table-column>
        </template>
        <template v-else>
          <el-table-column prop="presaleOrderNo" label="预销售单" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="contractNo" label="合同号" min-width="140" show-overflow-tooltip></el-table-column>
          <el-table-column prop="containerNo" label="柜号" min-width="130" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="100" align="center" header-align="center"></el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属主体" min-width="180" show-overflow-tooltip></el-table-column>
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
          <el-table-column prop="damageWeightKg" label="报损重量(KG)" width="120" align="right" header-align="center">
            <template slot-scope="scope">
              <span :class="{ 'inventory-damage': Number(scope.row.damageWeightKg || 0) > 0 }">{{ formatWeight(scope.row.damageWeightKg) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="damageReason" label="报损原因" min-width="200" show-overflow-tooltip></el-table-column>
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

    <el-dialog
      title="加权单价明细"
      :visible.sync="weightedCostDetailVisible"
      width="88vw"
      append-to-body>
      <div v-if="currentWeightedCostRow" class="batch-summary">
        <span>产品编码：{{ currentWeightedCostRow.productCode || '-' }}</span>
        <span>中文名称：{{ currentWeightedCostRow.productName || '-' }}</span>
        <span>加权平均单价：{{ numberText(currentWeightedCostRow.weightedUnitPrice, 6) }}</span>
      </div>
      <el-table :data="weightedCostDetailList" border stripe v-loading="weightedCostDetailLoading" height="430">
        <el-table-column type="index" label="序号" width="60" align="center" header-align="center"></el-table-column>
        <el-table-column prop="contractNo" label="确认函合同号" min-width="150" show-overflow-tooltip></el-table-column>
        <el-table-column prop="ownershipName" label="货权" min-width="170" show-overflow-tooltip></el-table-column>
        <el-table-column label="合同产品单价" width="130" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.weightedUnitPrice, 6) }}</template>
        </el-table-column>
        <el-table-column prop="availableBoxes" label="剩余箱数" width="100" align="right" header-align="center"></el-table-column>
        <el-table-column label="剩余重量(KG)" width="130" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.availableWeightKg, 3) }}</template>
        </el-table-column>
        <el-table-column label="权重占比(%)" width="120" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.weightPercent, 4) }}</template>
        </el-table-column>
        <el-table-column label="加权金额" width="130" align="right" header-align="center">
          <template slot-scope="scope">{{ numberText(scope.row.purchaseAmount, 2) }}</template>
        </el-table-column>
        <el-table-column label="计算说明" min-width="360" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ numberText(scope.row.weightedUnitPrice, 6) }} × {{ numberText(scope.row.availableWeightKg, 3) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
  import axios from 'axios'
  import PresaleInventory from './presale-inventory'

  export default {
    components: {
      PresaleInventory
    },
    data () {
      return {
        activeTab: 'spot',
        warehouseList: [],
        spotContainerOptions: [],
        spotContainerProductContainerOptions: [],
        spotContainerProductInboundDateRange: [],
        weightedCostContainerOptions: [],
        weightedCostInboundDateRange: [],
        futuresContainerOptions: [],
        inventoryOptionMap: {},
        inventoryOptionLoadingMap: {},
        inventoryOptionTimers: {},
        inventoryOptionRequestMap: {},
        inventoryOptionCancelMap: {},
        inventoryOptionCache: {},
        spotQuery: {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        },
        spotContainerProductQuery: {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        },
        weightedCostQuery: {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: ''
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
          productKeyword: '',
          orderNo: '',
          customerName: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        },
        spotList: [],
        spotContainerProductList: [],
        weightedCostList: [],
        weightedCostDetailList: [],
        futuresList: [],
        recordList: [],
        batchList: [],
        spotLoading: false,
        spotContainerProductLoading: false,
        weightedCostLoading: false,
        weightedCostDetailLoading: false,
        futuresLoading: false,
        spotContainerLoading: false,
        spotContainerProductContainerLoading: false,
        weightedCostContainerLoading: false,
        futuresContainerLoading: false,
        recordLoading: false,
        batchLoading: false,
        batchDialogVisible: false,
        weightedCostDetailVisible: false,
        batchDialogTitle: '库存批次详情',
        currentBatchType: 'spot',
        currentInventoryRow: null,
        currentWeightedCostRow: null
      }
    },
    activated () {
      this.loadWarehouses()
      this.getDataList()
    },
    methods: {
      inventoryOptionKey (scope, optionType) {
        return `${scope}:${optionType}`
      },
      inventoryOptionList (scope, optionType) {
        return this.inventoryOptionMap[this.inventoryOptionKey(scope, optionType)] || []
      },
      inventoryOptionLoading (scope, optionType) {
        return !!this.inventoryOptionLoadingMap[this.inventoryOptionKey(scope, optionType)]
      },
      openInventoryOption (scope, optionType, visible) {
        if (visible) this.remoteInventoryOption(scope, optionType, '')
      },
      remoteInventoryOption (scope, optionType, keyword) {
        const key = this.inventoryOptionKey(scope, optionType)
        if (this.inventoryOptionTimers[key]) clearTimeout(this.inventoryOptionTimers[key])
        this.inventoryOptionTimers[key] = setTimeout(() => {
          this.loadInventoryOptions(scope, optionType, keyword)
        }, 250)
      },
      loadInventoryOptions (scope, optionType, keyword) {
        const queryMap = {
          spot: this.spotQuery,
          spotContainerProduct: this.spotContainerProductQuery,
          weightedCost: this.weightedCostQuery,
          futures: this.futuresQuery,
          records: this.recordQuery
        }
        const query = queryMap[scope] || {}
        const params = Object.assign({}, query, {
          scope: scope,
          optionType: optionType,
          optionKeyword: keyword || ''
        })
        if (Array.isArray(params.containerNos)) params.containerNos = params.containerNos.join(',')
        if (scope === 'spotContainerProduct') {
          params.inboundDateStart = this.spotContainerProductInboundDateRange[0] || ''
          params.inboundDateEnd = this.spotContainerProductInboundDateRange[1] || ''
        } else if (scope === 'weightedCost') {
          params.inboundDateStart = this.weightedCostInboundDateRange[0] || ''
          params.inboundDateEnd = this.weightedCostInboundDateRange[1] || ''
        }
        const fieldMap = {
          product: scope === 'records' ? 'productKeyword' : 'keyword',
          order: 'orderNo',
          customer: 'customerName',
          contract: 'contractNo',
          warehouse: 'warehouseName',
          container: 'containerNo',
          factory: 'factoryNo'
        }
        const selected = query[fieldMap[optionType]] || ''
        const key = this.inventoryOptionKey(scope, optionType)
        const cacheKey = `${key}:${JSON.stringify(params)}`
        const cached = this.inventoryOptionCache[cacheKey]
        if (cached && Date.now() - cached.time < 30000) {
          let list = cached.list.slice()
          if (selected && !list.some(item => String(item.value) === String(selected))) {
            list = [{ value: selected, label: selected }].concat(list)
          }
          this.$set(this.inventoryOptionMap, key, list.slice(0, 15))
          return
        }
        if (this.inventoryOptionCancelMap[key]) {
          this.inventoryOptionCancelMap[key]('已发起新的候选项查询')
        }
        const requestId = (this.inventoryOptionRequestMap[key] || 0) + 1
        this.inventoryOptionRequestMap[key] = requestId
        this.$set(this.inventoryOptionLoadingMap, key, true)
        const cancelToken = new axios.CancelToken(cancel => {
          this.inventoryOptionCancelMap[key] = cancel
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/options'),
          method: 'get',
          params: this.$http.adornParams(params),
          cancelToken: cancelToken
        }).then(({data}) => {
          if (this.inventoryOptionRequestMap[key] !== requestId) return
          let list = (data && data.list) || []
          this.$set(this.inventoryOptionCache, cacheKey, { time: Date.now(), list: list.slice(0, 15) })
          if (selected && !list.some(item => String(item.value) === String(selected))) {
            list = [{ value: selected, label: selected }].concat(list)
          }
          this.$set(this.inventoryOptionMap, key, list.slice(0, 15))
          this.$set(this.inventoryOptionLoadingMap, key, false)
          delete this.inventoryOptionCancelMap[key]
        }).catch(error => {
          if (axios.isCancel(error)) return
          if (this.inventoryOptionRequestMap[key] !== requestId) return
          this.$set(this.inventoryOptionLoadingMap, key, false)
          delete this.inventoryOptionCancelMap[key]
        })
      },
      handleTabChange () {
        this.getDataList()
      },
      getDataList () {
        if (this.activeTab === 'futures') {
          this.getFuturesList()
        } else if (this.activeTab === 'spotContainerProduct') {
          this.getSpotContainerProductList()
        } else if (this.activeTab === 'weightedCost') {
          this.getWeightedCostList()
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
      getSpotContainerProductList () {
        this.spotContainerProductLoading = true
        const inboundRange = this.spotContainerProductInboundDateRange || []
        const params = Object.assign({}, this.spotContainerProductQuery, {
          containerNos: this.spotContainerProductQuery.containerNos.join(','),
          inboundDateStart: inboundRange[0] || '',
          inboundDateEnd: inboundRange[1] || ''
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/spot/by-container-product'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.spotContainerProductList = data.list || []
          } else {
            this.spotContainerProductList = []
            this.$message.error((data && data.msg) || '获取柜号产品库存失败')
          }
          this.spotContainerProductLoading = false
        }).catch(() => {
          this.spotContainerProductLoading = false
        })
      },
      getWeightedCostList () {
        this.weightedCostLoading = true
        const inboundRange = this.weightedCostInboundDateRange || []
        const params = Object.assign({}, this.weightedCostQuery, {
          containerNos: this.weightedCostQuery.containerNos.join(','),
          inboundDateStart: inboundRange[0] || '',
          inboundDateEnd: inboundRange[1] || ''
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/weighted-cost'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.weightedCostList = data.list || []
          } else {
            this.weightedCostList = []
            this.$message.error((data && data.msg) || '获取加权单价报告失败')
          }
          this.weightedCostLoading = false
        }).catch(() => {
          this.weightedCostLoading = false
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
        const isSpotLike = type === 'spot' || type === 'spotContainerProduct'
        this.currentBatchType = isSpotLike ? 'spot' : 'futures'
        this.batchList = []
        this.batchDialogTitle = type === 'futures' ? '期货库存来源详情' : (type === 'spotContainerProduct' ? '柜号产品库存来源详情' : '现货库存来源详情')
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
            onlyAvailable: this.futuresQuery.onlyAvailable,
            businessEntityId: row.businessEntityId
          }
          : type === 'spotContainerProduct'
          ? {
            productId: row.productId,
            warehouseId: row.warehouseId,
            contractNo: this.spotContainerProductQuery.contractNo,
            containerNos: row.containerNo || '',
            ownershipName: row.ownershipName || '',
            factoryNo: this.spotContainerProductQuery.factoryNo,
            inboundDateStart: this.formatDate(row.inboundDate),
            inboundDateEnd: this.formatDate(row.inboundDate),
            onlyAvailable: this.spotContainerProductQuery.onlyAvailable
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
      openWeightedCostDetail (row) {
        this.currentWeightedCostRow = row
        this.weightedCostDetailList = []
        this.weightedCostDetailVisible = true
        this.weightedCostDetailLoading = true
        const inboundRange = this.weightedCostInboundDateRange || []
        const params = Object.assign({}, this.weightedCostQuery, {
          productId: row.productId,
          containerNos: this.weightedCostQuery.containerNos.join(','),
          inboundDateStart: inboundRange[0] || '',
          inboundDateEnd: inboundRange[1] || ''
        })
        this.$http({
          url: this.$http.adornUrl('/erp/inventory/weighted-cost/details'),
          method: 'get',
          params: this.$http.adornParams(params)
        }).then(({data}) => {
          if (data && data.code === 0) {
            this.weightedCostDetailList = data.list || []
          } else {
            this.weightedCostDetailList = []
            this.$message.error((data && data.msg) || '获取加权单价明细失败')
          }
          this.weightedCostDetailLoading = false
        }).catch(() => {
          this.weightedCostDetailLoading = false
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
      resetSpotContainerProductQuery () {
        this.spotContainerProductQuery = {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: '',
          onlyAvailable: '1'
        }
        this.spotContainerProductInboundDateRange = []
        this.spotContainerProductContainerOptions = []
        this.spotContainerProductList = []
        this.getSpotContainerProductList()
      },
      resetWeightedCostQuery () {
        this.weightedCostQuery = {
          keyword: '',
          warehouseId: '',
          contractNo: '',
          containerNos: [],
          factoryNo: ''
        }
        this.weightedCostInboundDateRange = []
        this.weightedCostContainerOptions = []
        this.weightedCostList = []
        this.getWeightedCostList()
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
          productKeyword: '',
          orderNo: '',
          customerName: '',
          recordType: '',
          contractNo: '',
          warehouseName: '',
          containerNo: '',
          factoryNo: ''
        }
        this.getRecordList()
      },
      recordWarehouseChange () {
        this.recordQuery.containerNo = ''
        this.$set(this.inventoryOptionMap, this.inventoryOptionKey('records', 'container'), [])
      },
      formatContractNos (row) {
        if (!row) return '-'
        if (row.contractNo) return row.contractNo
        if (row.contractNos) return row.contractNos
        return '-'
      },
      formatWeight (value) {
        const number = Number(value)
        return isNaN(number) ? '0.00' : number.toFixed(2)
      },
      numberText (value, scale) {
        const number = Number(value)
        return isNaN(number) ? Number(0).toFixed(scale || 2) : number.toFixed(scale || 2)
      },
      isAllFreshToFrozen (row) {
        return row && (row.freshToFrozenStatus === 'ALL' || row.freshToFrozenStatus === '全部鲜转冻')
      },
      isPartialFreshToFrozen (row) {
        return row && (row.freshToFrozenStatus === 'PARTIAL' || row.freshToFrozenStatus === '部分鲜转冻')
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
      spotContainerProductWarehouseChange () {
        this.spotContainerProductQuery.containerNos = []
        this.spotContainerProductContainerOptions = []
        this.spotContainerProductList = []
        this.remoteSearchSpotContainerProductContainers('')
      },
      weightedCostWarehouseChange () {
        this.weightedCostQuery.containerNos = []
        this.weightedCostContainerOptions = []
        this.weightedCostList = []
        this.remoteSearchWeightedCostContainers('')
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
      remoteSearchSpotContainerProductContainers (keyword) {
        this.remoteSearchContainers('spotContainerProduct', keyword)
      },
      remoteSearchWeightedCostContainers (keyword) {
        this.remoteSearchContainers('weightedCost', keyword)
      },
      remoteSearchFuturesContainers (keyword) {
        this.remoteSearchContainers('futures', keyword)
      },
      remoteSearchContainers (inventoryType, keyword) {
        const isFutures = inventoryType === 'futures'
        const isSpotContainerProduct = inventoryType === 'spotContainerProduct'
        const isWeightedCost = inventoryType === 'weightedCost'
        const query = isFutures ? this.futuresQuery : (isWeightedCost ? this.weightedCostQuery : (isSpotContainerProduct ? this.spotContainerProductQuery : this.spotQuery))
        if (!query.warehouseId) {
          if (isFutures) {
            this.futuresContainerOptions = []
          } else if (isWeightedCost) {
            this.weightedCostContainerOptions = []
          } else if (isSpotContainerProduct) {
            this.spotContainerProductContainerOptions = []
          } else {
            this.spotContainerOptions = []
          }
          return
        }
        if (isFutures) {
          this.futuresContainerLoading = true
        } else if (isWeightedCost) {
          this.weightedCostContainerLoading = true
        } else if (isSpotContainerProduct) {
          this.spotContainerProductContainerLoading = true
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
          } else if (isWeightedCost) {
            this.weightedCostContainerOptions = options
            this.weightedCostContainerLoading = false
          } else if (isSpotContainerProduct) {
            this.spotContainerProductContainerOptions = options
            this.spotContainerProductContainerLoading = false
          } else {
            this.spotContainerOptions = options
            this.spotContainerLoading = false
          }
        }).catch(() => {
          if (isFutures) {
            this.futuresContainerLoading = false
          } else if (isWeightedCost) {
            this.weightedCostContainerLoading = false
          } else if (isSpotContainerProduct) {
            this.spotContainerProductContainerLoading = false
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

  .mod-erp-inventory .el-form .el-select {
    width: 210px;
  }

  .inventory-danger {
    color: #f56c6c;
    font-weight: 600;
  }

  .inventory-damage {
    color: #f56c6c;
    font-weight: 600;
  }

  .fresh-frozen-cell {
    line-height: 1.4;
  }

  .fresh-frozen-summary {
    margin-top: 3px;
    color: #606266;
    font-size: 12px;
    white-space: nowrap;
  }

  .inventory-date-range {
    width: 340px;
  }

  /deep/ .inventory-date-range .el-range-separator {
    width: 28px;
    padding: 0;
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
