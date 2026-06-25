<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="1300px"
    top="4vh"
    custom-class="presale-order-dialog-modal">
    <div
      class="presale-order-dialog"
      v-loading="detailLoading"
      element-loading-text="数据加载中...">
      <el-tabs v-model="activeTab" class="presale-order-tabs">
        <el-tab-pane label="预售销售单" name="estimate">
          <div class="tab-pane-content">
            <div class="tab-tools">
              <el-button
                v-if="dataForm.id && dataForm.estimateFilePath"
                type="text"
                @click="downloadFile(`/erp/presale/download/estimate/${dataForm.id}`)">下载预售销售单原件</el-button>
            </div>
            <div class="tab-scroll-area">
              <el-form :model="dataForm" :rules="estimateRules" label-width="120px">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="预销售单号">
                      <el-input v-model="dataForm.orderNo" :disabled="true"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="合同号" prop="sellerContractNo">
                      <el-input v-model="dataForm.sellerContractNo" :disabled="readonly"></el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="采购方" prop="customerPartnerId">
                      <el-select
                        v-model="dataForm.customerPartnerId"
                        filterable
                        clearable
                        :disabled="readonly"
                        style="width: 100%;"
                        @change="customerPartnerChange">
                        <el-option
                          v-for="item in internalPartnerList"
                          :key="item.id"
                          :label="item.partnerName"
                          :value="item.id">
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="品牌方" prop="brandId">
                      <el-select v-model="dataForm.brandId" filterable clearable :disabled="readonly" style="width: 100%;">
                        <el-option
                          v-for="item in brandPartnerList"
                          :key="item.id"
                          :label="item.partnerName"
                          :value="item.id">
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="币种">
                      <el-select v-model="dataForm.currency" :disabled="readonly" style="width: 100%;">
                        <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="下单日期" prop="orderDate">
                      <el-date-picker v-model="dataForm.orderDate" type="datetime" :disabled="readonly" style="width: 100%;"></el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="预计到港">
                      <el-date-picker v-model="dataForm.expectedDate" type="date" format="yyyy-MM-dd" value-format="yyyy-MM-dd 00:00:00" :disabled="readonly" style="width: 100%;"></el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="备注">
                      <el-input v-model="dataForm.remark" type="textarea" :disabled="readonly" placeholder="请手动填写备注"></el-input>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <div v-if="!readonly" class="estimate-item-toolbar">
              <el-button type="primary" size="mini" @click="addEstimateItemRow()">新增By产品</el-button>
            </div>
            <el-table :data="dataForm.itemList" border size="mini" height="420">
            <el-table-column label="#" width="50" align="center">
              <template slot-scope="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column label="产品代码" min-width="170">
              <template slot="header">
                <span class="required-column-label">产品代码</span>
              </template>
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.productCode"
                  :disabled="readonly"
                  placeholder="可填写组合编码，如 27917/27918/27887"
                  @input="scope.row.sourceProductCode = scope.row.productCode">
                </el-input>
              </template>
            </el-table-column>
            <el-table-column label="产品中文名" min-width="180">
              <template slot-scope="scope">
                <span>{{ scope.row.productName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="产品英文名" min-width="240">
              <template slot-scope="scope">
                <span>{{ scope.row.productNameEn || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="数量(吨)" min-width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.quantityTon" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="数量(KG)" min-width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.quantityKg" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="单价" min-width="100">
              <template slot-scope="scope">
                <el-input v-model.number="scope.row.priceAmount" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column label="币种" min-width="90">
              <template slot-scope="scope">
                <el-select v-model="scope.row.priceCurrency" :disabled="readonly" style="width: 100%;">
                  <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item"></el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="180">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remark" :disabled="readonly"></el-input>
              </template>
            </el-table-column>
            <el-table-column v-if="!readonly" label="操作" width="90" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="small" @click="removeEstimateItemRow(scope.$index)">删除</el-button>
              </template>
            </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="onlyEstimate" label="关联客户订单确认" name="linkedConfirm">
          <div class="tab-pane-content">
            <div class="linked-confirm-summary">
              <el-row :gutter="12">
                <el-col :span="6">
                  <div class="summary-card">
                    <div class="summary-label">预售单总重量(KG)</div>
                    <div class="summary-value">{{ money(presaleTotalWeightKg) }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-card">
                    <div class="summary-label">确认函总重量(KG)</div>
                    <div class="summary-value">{{ money(confirmTotalWeightKg) }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-card" :class="{ 'is-warning': remainingPresaleWeightKg < 0 }">
                    <div class="summary-label">剩余未确认重量(KG)</div>
                    <div class="summary-value">{{ money(remainingPresaleWeightKg) }}</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="summary-card">
                    <div class="summary-label">确认占比</div>
                    <div class="summary-value">{{ confirmWeightPercent }}</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <el-table
              :data="linkedConfirmRows"
              border
              size="small"
              height="440"
              empty-text="暂无关联客户订单确认">
              <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
              <el-table-column prop="contractNo" label="确认函合同号" min-width="170" show-overflow-tooltip></el-table-column>
              <el-table-column prop="containerNo" label="柜号" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="buyerPartnerName" label="采购方" min-width="180" show-overflow-tooltip></el-table-column>
              <el-table-column prop="coldFreshType" label="冷冻/冷鲜" width="110" align="center"></el-table-column>
              <el-table-column label="预计到港" width="120" align="center">
                <template slot-scope="scope">{{ formatDateOnly(scope.row.expectedArrivalDate) }}</template>
              </el-table-column>
              <el-table-column label="确认函重量(KG)" width="140" align="right">
                <template slot-scope="scope">{{ money(scope.row.confirmWeightKg) }}</template>
              </el-table-column>
              <el-table-column label="总金额" width="130" align="right">
                <template slot-scope="scope">{{ money(scope.row.totalAmount) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center" fixed="right">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="setActiveConfirmFromSummary(scope.row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane v-if="!onlyEstimate" label="客户订单确认函" name="confirm">
          <div class="tab-pane-content">
            <div class="tab-tools">
              <el-button
                v-if="dataForm.id && dataForm.confirmInfo && dataForm.confirmInfo.filePath"
                type="text"
                @click="downloadFile(`/erp/presale/download/confirm/${dataForm.id}`)">下载客户订单确认函原件</el-button>
            </div>
            <el-empty v-if="!hasConfirmData" description="暂未上传客户订单确认函"></el-empty>
            <div v-else class="tab-pane-content-body">
              <div class="tab-scroll-area">
                <el-form ref="confirmForm" :model="dataForm.confirmInfo" :rules="confirmRules" label-width="120px">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="卖方/品牌方" prop="brandId">
                        <el-select v-model="dataForm.confirmInfo.brandId" filterable clearable :disabled="readonly" style="width: 100%;">
                          <el-option
                            v-for="item in brandPartnerList"
                            :key="item.id"
                            :label="item.partnerName"
                            :value="item.id">
                          </el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="采购方" prop="buyerPartnerId">
                        <el-select v-model="dataForm.confirmInfo.buyerPartnerId" filterable clearable :disabled="readonly" style="width: 100%;">
                          <el-option
                            v-for="item in buyerPartnerList"
                            :key="item.id"
                            :label="item.partnerName"
                            :value="item.id">
                          </el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="采购方角色">
                        <el-input :value="buyerPartnerRoleLabel" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="合同号" prop="contractNo">
                        <el-input v-model="dataForm.confirmInfo.contractNo" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="集装箱箱号" prop="containerNo">
                        <el-input v-model="dataForm.confirmInfo.containerNo" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="冷冻/冷鲜" prop="coldFreshType">
                        <el-select v-model="dataForm.confirmInfo.coldFreshType" clearable :disabled="readonly" placeholder="请选择冷冻/冷鲜" style="width: 100%;">
                          <el-option label="冷冻" value="冷冻"></el-option>
                          <el-option label="冷鲜" value="冷鲜"></el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="预计到港时间" prop="expectedArrivalDate">
                        <el-date-picker
                          v-model="dataForm.confirmInfo.expectedArrivalDate"
                          type="date"
                          format="yyyy-MM-dd"
                          value-format="yyyy-MM-dd 00:00:00"
                          :disabled="readonly"
                          style="width: 100%;">
                        </el-date-picker>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="总金额(CNY)" prop="totalAmount">
                        <el-input v-model.number="dataForm.confirmInfo.totalAmount" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="币种">
                        <el-select v-model="dataForm.confirmInfo.currency" :disabled="readonly" style="width: 100%;">
                          <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item"></el-option>
                        </el-select>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="备注">
                        <el-input v-model="dataForm.confirmInfo.remark" type="textarea" :disabled="readonly" placeholder="请手动填写备注"></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>

              </div>

              <div v-if="!readonly" class="confirm-item-toolbar">
                <el-button type="primary" size="mini" @click="addConfirmItemRow()">新增By产品</el-button>
              </div>
              <div class="confirm-table-wrap">
                <div class="confirm-summary">
                  <template v-if="confirmAmountDiff">
                    <div class="confirm-summary-line">
                      <span>总金额与列表统计金额有差异，请核对</span>
                    </div>
                  </template>
                  <div class="confirm-warning">
                    列表总值汇总(含税)：{{ money(confirmLineTotalInclTax) }}
                  </div>
                  
                </div>
                <el-table
                  class="confirm-item-table"
                  :data="dataForm.confirmInfo.itemList"
                  border
                  size="mini"
                  height="100%">
              <el-table-column label="#" width="50" align="center">
                <template slot-scope="scope">{{ scope.$index + 1 }}</template>
              </el-table-column>
              <el-table-column label="存货编码" prop="sourceProductCode" min-width="110"></el-table-column>
              <el-table-column label="主产品代码" min-width="160">
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.productCode"
                    filterable
                    clearable
                    remote
                    reserve-keyword
                    :disabled="readonly"
                    :loading="scope.row._productLoading"
                    placeholder="请输入产品编码/中英文名称搜索"
                    style="width: 100%;"
                    @visible-change="(visible) => productSelectVisibleChange(scope.row, visible)"
                    :remote-method="(keyword) => remoteSearchProducts(scope.row, keyword)"
                    @change="(value) => productSelectChange(scope.row, value)">
                    <el-option
                      v-for="item in scope.row._productOptions"
                      :key="item.productCode"
                      :label="item.productCode"
                      :value="item.productCode">
                      <div class="product-option-code">{{ item.productCode }}</div>
                      <div class="product-option-name">{{ item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="存货名称" min-width="160">
                <template slot-scope="scope">
                  <span>{{ scope.row.productName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="货物名称" min-width="220">
                <template slot-scope="scope">
                  <span>{{ scope.row.productNameEn || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="市场流通名称" min-width="180">
                <template slot-scope="scope">
                  <span>{{ scope.row.marketCirculationName || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="计量单位" min-width="130">
                <template slot-scope="scope">
                  <el-select v-model="scope.row.unit" :disabled="readonly" style="width: 100%;">
                    <el-option v-for="item in measureUnitOptions" :key="item" :label="item" :value="item"></el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="数量" min-width="100">
                <template slot-scope="scope">
                  <el-input v-model.number="scope.row.quantity" :disabled="readonly"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="单价(含税)" min-width="110">
                <template slot-scope="scope">
                  <el-input v-model.number="scope.row.unitPriceInclTax" :disabled="readonly"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="总值(含税)" min-width="120">
                <template slot-scope="scope">
                  <el-input v-model.number="scope.row.lineTotalInclTax" :disabled="readonly"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="总值(未税)" min-width="120">
                <template slot-scope="scope">
                  <span>{{ money(calcLineTotalExclTax(scope.row)) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="180">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.remark" :disabled="readonly"></el-input>
                </template>
              </el-table-column>
              <el-table-column v-if="!readonly" label="操作" width="90" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="removeConfirmItemRow(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="!onlyEstimate" label="装箱单" name="packing">
          <div class="tab-pane-content">
            <div class="tab-tools">
              <el-button
                v-if="dataForm.id && dataForm.packingInfo && dataForm.packingInfo.filePath"
                type="text"
                @click="downloadFile(`/erp/presale/download/packing/${dataForm.id}`)">下载装箱单原件</el-button>
            </div>
            <el-empty v-if="!hasPackingData" description="暂未上传装箱单"></el-empty>
            <div v-else class="tab-pane-content-body">
              <div class="tab-scroll-area">
                <el-form :model="dataForm.packingInfo" :rules="packingRules" label-width="150px" class="packing-summary-form">
                  <el-row :gutter="20">
                    <el-col :span="8">
                      <el-form-item label="合同号" prop="contractNo">
                        <el-input v-model="dataForm.packingInfo.contractNo" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="集装箱号" prop="containerNo">
                        <el-input v-model="dataForm.packingInfo.containerNo" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="8">
                      <el-form-item label="保质期天数" prop="shelfLifeDays">
                        <el-input v-model.number="dataForm.packingInfo.shelfLifeDays" :disabled="readonly"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="识别总箱数">
                        <el-input :value="packingRecognizedTotalBoxes" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="识别总重量(KG)">
                        <el-input :value="money(packingRecognizedTotalWeight)" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="明细汇总总箱数">
                        <el-input :value="packingTotalBoxes" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="明细汇总总重量(KG)">
                        <el-input :value="money(packingTotalWeight)" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>

              <div v-if="packingSummaryDiff" class="packing-summary-warning">
                识别总计与明细汇总存在差异，请核对装箱单明细。
              </div>
              <div v-if="!readonly" class="packing-item-toolbar">
                <el-button type="primary" size="mini" @click="addPackingItemRow()">新增By产品</el-button>
              </div>
              <el-table
                :data="dataForm.packingInfo.itemList"
                :row-key="packingRowKey"
                :expand-row-keys="packingExpandedKeys"
                height="420"
                border
                size="mini">
                <el-table-column type="expand">
                  <template slot-scope="scope">
                    <div v-if="!readonly" class="packing-batch-toolbar">
                      <el-button type="primary" size="mini" @click="addPackingBatchRow(scope.row)">新增明细</el-button>
                    </div>
                    <el-table :data="scope.row.batchList || []" border size="mini">
                      <el-table-column label="生产日期" min-width="120">
                        <template slot-scope="batchScope">
                          <el-date-picker
                            v-model="batchScope.row.productionDate"
                            type="date"
                            format="yyyy-MM-dd"
                            value-format="yyyy-MM-dd 00:00:00"
                            :disabled="readonly"
                            style="width: 100%;">
                          </el-date-picker>
                        </template>
                      </el-table-column>
                      <el-table-column label="过期日期" min-width="120">
                        <template slot-scope="batchScope">
                          <el-date-picker
                            v-model="batchScope.row.expiryDate"
                            type="date"
                            format="yyyy-MM-dd"
                            value-format="yyyy-MM-dd 00:00:00"
                            :disabled="readonly"
                            style="width: 100%;">
                          </el-date-picker>
                        </template>
                      </el-table-column>
                      <el-table-column label="箱数" min-width="100">
                        <template slot-scope="batchScope">
                          <el-input
                            v-model.number="batchScope.row.boxCount"
                            :disabled="readonly"
                            @input="handlePackingBatchChange(scope.row)">
                          </el-input>
                        </template>
                      </el-table-column>
                      <el-table-column label="操作" width="150" align="center">
                        <template slot-scope="batchScope">
                          <el-button
                            v-if="!readonly"
                            type="text"
                            size="small"
                            @click="removePackingBatchRow(scope.row, batchScope.$index)">删除</el-button>
                          <el-button
                            v-if="!readonly && batchScope.$index === (scope.row.batchList || []).length - 1"
                            type="text"
                            size="small"
                            @click="addPackingBatchRow(scope.row)">新增</el-button>
                        </template>
                      </el-table-column>
                    </el-table>
                  </template>
                </el-table-column>
                <el-table-column label="#" width="50" align="center">
                  <template slot-scope="scope">{{ scope.$index + 1 }}</template>
                </el-table-column>
                <el-table-column label="系统产品" min-width="180">
                  <template slot-scope="scope">
                    <el-select
                      v-model="scope.row.productCode"
                      filterable
                      clearable
                      remote
                      reserve-keyword
                      :disabled="readonly"
                      :loading="scope.row._productLoading"
                      placeholder="请输入产品编码/中英文名称搜索"
                      style="width: 100%;"
                      @visible-change="(visible) => productSelectVisibleChange(scope.row, visible)"
                      :remote-method="(keyword) => remoteSearchProducts(scope.row, keyword)"
                      @change="(value) => productSelectChange(scope.row, value)">
                      <el-option
                        v-for="item in scope.row._productOptions"
                        :key="item.productCode"
                        :label="item.productCode"
                        :value="item.productCode">
                        <div class="product-option-code">{{ item.productCode }}</div>
                        <div class="product-option-name">{{ item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                      </el-option>
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="产品中文名" prop="productName" min-width="160"></el-table-column>
                <el-table-column label="产品英文名" prop="productNameEn" min-width="260"></el-table-column>
                <el-table-column label="厂号" min-width="120">
                  <template slot-scope="scope">
                    <el-input
                      v-model.trim="scope.row.factoryNo"
                      :disabled="readonly"
                      placeholder="请输入厂号">
                    </el-input>
                  </template>
                </el-table-column>
                <el-table-column label="总箱数" prop="totalBoxes" min-width="90"></el-table-column>
                <el-table-column label="总重量(KG)" min-width="110">
                  <template slot-scope="scope">
                    <el-input-number
                      v-model="scope.row.totalWeight"
                      :disabled="readonly"
                      :controls="false"
                      :precision="2"
                      :min="0"
                      size="mini"
                      style="width: 100%;">
                    </el-input-number>
                  </template>
                </el-table-column>
                <el-table-column label="保质期天数" prop="shelfLifeDays" min-width="100"></el-table-column>
                <el-table-column v-if="!readonly" label="操作" width="150" align="center">
                  <template slot-scope="scope">
                    <el-button
                      type="text"
                      size="small"
                      @click="removePackingItemRow(scope.$index)">删除</el-button>
                    <el-button
                      v-if="scope.$index === (dataForm.packingInfo.itemList || []).length - 1"
                      type="text"
                      size="small"
                      @click="addPackingItemRow()">新增</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="!onlyEstimate" label="报关单" name="customs">
          <div class="tab-pane-content">
            <div class="tab-tools">
              <el-button
                v-if="dataForm.id && dataForm.customsInfo && dataForm.customsInfo.filePath"
                type="text"
                @click="downloadFile(`/erp/presale/download/customs/${dataForm.id}`)">下载报关单原件</el-button>
              <el-button
                v-if="dataForm.id"
                type="text"
                @click="reuploadAttachment('customs')">重新上传</el-button>
            </div>
            <el-empty v-if="!hasCustomsData" description="暂未上传报关单"></el-empty>
            <div v-else class="tab-pane-content-body">
              <div class="tab-scroll-area">
                <el-form :model="dataForm.customsInfo" label-width="120px">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <el-form-item label="文件名称">
                        <el-input :value="dataForm.customsInfo.fileName" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="上传时间">
                        <el-input :value="formatDateTime(dataForm.customsInfo.updateTime || dataForm.customsInfo.createTime)" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="识别毛重(KG)">
                        <el-input :value="dataForm.customsInfo.recognizedGrossWeight || ''" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                    <el-col :span="12">
                      <el-form-item label="确认毛重(KG)">
                        <el-input-number
                          v-model="dataForm.customsInfo.confirmedGrossWeight"
                          :precision="3"
                          :min="0"
                          :controls="false"
                          :disabled="readonly"
                          style="width: 100%;">
                        </el-input-number>
                      </el-form-item>
                    </el-col>
                    <el-col :span="24">
                      <el-form-item label="归档路径">
                        <el-input :value="dataForm.customsInfo.filePath" :disabled="true"></el-input>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="!onlyEstimate" label="检疫证明" name="quarantine">
          <div class="tab-pane-content">
            <div class="tab-tools">
              <el-button
                v-if="dataForm.id"
                type="text"
                @click="reuploadAttachment('quarantine')">重新上传检疫证明</el-button>
            </div>
            <el-empty v-if="!hasQuarantineData" description="暂未上传检疫证明"></el-empty>
            <div v-else class="tab-pane-content-body">
              <div class="tab-scroll-area">
                <el-table
                  :data="dataForm.quarantineList"
                  border
                  height="260"
                  size="small">
                  <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
                  <el-table-column prop="fileName" label="文件名称" min-width="220"></el-table-column>
                  <el-table-column label="上传时间" width="180">
                    <template slot-scope="scope">
                      {{ formatDateTime(scope.row.updateTime || scope.row.createTime) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="filePath" label="归档路径" min-width="260"></el-table-column>
                  <el-table-column label="操作" width="100" align="center" fixed="right">
                    <template slot-scope="scope">
                      <el-button
                        type="text"
                        size="small"
                        @click="downloadFile(`/erp/presale/download/attachment/${scope.row.id}`)">下载</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">{{ readonly ? '关闭' : '取消' }}</el-button>
      <el-button v-if="!readonly" type="primary" :loading="saveLoading" :disabled="saveLoading" @click="submitHandle()">保存</el-button>
    </span>
    <el-dialog
      title="客户订单确认详情"
      :visible.sync="linkedConfirmDetailVisible"
      append-to-body
      width="1080px"
      custom-class="linked-confirm-detail-dialog">
      <div v-if="linkedConfirmDetail" class="linked-confirm-detail">
        <div class="linked-confirm-detail-grid">
          <div class="detail-cell"><span>确认函合同号</span><strong>{{ linkedConfirmDetail.contractNo || '-' }}</strong></div>
          <div class="detail-cell"><span>柜号</span><strong>{{ linkedConfirmDetail.containerNo || '-' }}</strong></div>
          <div class="detail-cell"><span>预计到港</span><strong>{{ formatDateOnly(linkedConfirmDetail.expectedArrivalDate) }}</strong></div>
          <div class="detail-cell"><span>卖方/品牌方</span><strong>{{ linkedConfirmDetail.brandName || '-' }}</strong></div>
          <div class="detail-cell"><span>采购方</span><strong>{{ linkedConfirmDetail.buyerPartnerName || '-' }}</strong></div>
          <div class="detail-cell"><span>冷冻/冷鲜</span><strong>{{ linkedConfirmDetail.coldFreshType || '-' }}</strong></div>
          <div class="detail-cell"><span>确认函重量(KG)</span><strong>{{ money(linkedConfirmDetail.confirmWeightKg) }}</strong></div>
          <div class="detail-cell"><span>总金额</span><strong>{{ money(linkedConfirmDetail.totalAmount) }}</strong></div>
          <div class="detail-cell"><span>币种</span><strong>{{ linkedConfirmDetail.currency || '-' }}</strong></div>
        </div>
        <el-table
          :data="linkedConfirmDetail.itemList || []"
          border
          size="small"
          height="360"
          class="linked-confirm-detail-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="sourceProductCode" label="确认函编码" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productCode" label="系统编码" min-width="120" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productName" label="产品中文名" min-width="160" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productNameEn" label="产品英文名" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="marketCirculationName" label="市场流通名称" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="unit" label="计量单位" width="100" align="center"></el-table-column>
          <el-table-column label="数量(KG)" width="120" align="right">
            <template slot-scope="scope">{{ money(scope.row.quantity) }}</template>
          </el-table-column>
          <el-table-column label="单价(含税)" width="120" align="right">
            <template slot-scope="scope">{{ money(scope.row.unitPriceInclTax) }}</template>
          </el-table-column>
          <el-table-column label="总值(含税)" width="130" align="right">
            <template slot-scope="scope">{{ money(scope.row.lineTotalInclTax) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="linkedConfirmDetailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    <presale-upload-dialog
      v-if="attachmentUploadVisible"
      ref="attachmentUploadDialog"
      :upload-type="attachmentUploadType"
      :order-id="dataForm.id"
      :confirm-id="(dataForm.confirmInfo || {}).id"
      @uploaded="attachmentUploadedHandle">
    </presale-upload-dialog>
  </el-dialog>
</template>

<script>
import PresaleUploadDialog from './presale-upload-dialog'

function defaultEstimateItem () {
  return {
    id: 0,
    sourceProductCode: '',
    productCode: '',
    productName: '',
    productNameEn: '',
    quantityTon: 0,
    quantityKg: 0,
    priceAmount: 0,
    priceCurrency: 'CNY',
    priceUnit: 'KG',
    remark: '',
    _productKeyword: '',
    _productLoading: false,
    _productOptions: [],
    _recognizedProductName: '',
    _recognizedProductNameEn: ''
  }
}

function defaultConfirmItem () {
  return {
    id: 0,
    sourceProductCode: '',
    productCode: '',
    productName: '',
    productNameEn: '',
    marketCirculationName: '',
    unit: 'KG',
    quantity: 0,
    unitPriceInclTax: 0,
    lineTotalInclTax: 0,
    taxRate: 9,
    remark: '',
    _productKeyword: '',
    _productLoading: false,
    _productOptions: [],
    _recognizedProductName: '',
    _recognizedProductNameEn: ''
  }
}

function defaultConfirmInfo () {
  return {
    id: 0,
    brandId: '',
    brandName: '',
    buyerPartnerId: '',
    buyerPartnerName: '',
    buyerPartnerRole: '',
    contractNo: '',
    containerNo: '',
    coldFreshType: '',
    expectedArrivalDate: null,
    totalAmount: 0,
    currency: 'CNY',
    filePath: '',
    fileName: '',
    rawText: '',
    remark: '',
    itemList: []
  }
}

function defaultPackingBatch () {
  return {
    id: 0,
    productionDate: '',
    expiryDate: '',
    boxCount: 0,
    weight: 0
  }
}

function defaultPackingItem () {
  return {
    id: 0,
    sourceProductCode: '',
    productCode: '',
    productName: '',
    productNameEn: '',
    factoryNo: '',
    totalBoxes: 0,
    totalWeight: 0,
    shelfLifeDays: 0,
    batchList: [],
    _productKeyword: '',
    _productLoading: false,
    _productOptions: [],
    _recognizedProductName: '',
    _recognizedProductNameEn: ''
  }
}

function defaultPackingInfo () {
  return {
    id: 0,
    contractNo: '',
    containerNo: '',
    shelfLifeDays: 0,
    totalBoxes: 0,
    totalWeight: 0,
    filePath: '',
    fileName: '',
    rawText: '',
    remark: '',
    itemList: []
  }
}

function defaultAttachmentInfo () {
  return {
    id: 0,
    attachmentType: '',
    filePath: '',
    fileName: '',
    recognizedGrossWeight: null,
    confirmedGrossWeight: null,
    rawText: '',
    remark: '',
    createTime: '',
    updateTime: ''
  }
}

function defaultForm () {
  return {
    id: 0,
    orderNo: '',
    sellerContractNo: '',
    customerPartnerId: '',
    customerReference: '',
    brandId: '',
    brandName: '',
    estimateFilePath: '',
    estimateFileName: '',
    estimateRawText: '',
    currency: 'CNY',
    orderDate: new Date(),
    expectedDate: null,
    status: 0,
    remark: '',
    itemList: [],
    confirmInfo: defaultConfirmInfo(),
    confirmList: [],
    packingInfo: defaultPackingInfo(),
    customsInfo: defaultAttachmentInfo(),
    quarantineInfo: defaultAttachmentInfo(),
    quarantineList: []
  }
}

const BIZ_ROLE_LABEL_MAP = {
  BRAND: '品牌方',
  FUNDER: '资方',
  SECONDARY: '二批主体',
  INTERNAL: '鲜牧内部主体'
}

export default {
  components: {
    PresaleUploadDialog
  },
  props: {
    onlyEstimate: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      visible: false,
      readonly: false,
      activeTab: 'estimate',
      saveLoading: false,
      detailLoading: false,
      attachmentUploadVisible: false,
      attachmentUploadType: 'customs',
      linkedConfirmDetailVisible: false,
      linkedConfirmDetail: null,
      dataForm: defaultForm(),
      partnerList: [],
      productList: [],
      currencyOptions: ['CNY', 'USD'],
      measureUnitOptions: ['KG', 'TON', '箱', '件'],
      estimateRules: {
        brandId: [
          { required: true, message: '请选择预售销售单品牌方', trigger: 'change' }
        ],
        sellerContractNo: [
          { required: true, message: '预售销售单合同号不能为空', trigger: 'blur' }
        ],
        customerPartnerId: [
          { required: true, message: '请选择预售销售单采购方', trigger: 'change' }
        ],
        orderDate: [
          { required: true, message: '预售销售单下单日期不能为空', trigger: 'change' }
        ]
      },
      confirmRules: {
        brandId: [
          { required: true, message: '请选择卖方/品牌方', trigger: 'change' }
        ],
        buyerPartnerId: [
          { required: true, message: '请选择采购方', trigger: 'change' }
        ],
        contractNo: [
          { required: true, message: '请输入合同号', trigger: 'blur' }
        ],
        containerNo: [
          { required: true, message: '请输入集装箱箱号', trigger: 'blur' }
        ],
        coldFreshType: [
          { required: true, message: '请选择冷冻/冷鲜', trigger: 'change' }
        ],
        expectedArrivalDate: [
          { required: true, message: '请选择预计到港时间', trigger: 'change' }
        ],
        totalAmount: [
          { required: true, message: '请输入总金额', trigger: 'blur' }
        ]
      },
      packingRules: {
        contractNo: [
          { required: true, message: '装箱单合同号不能为空', trigger: 'blur' }
        ],
        containerNo: [
          { required: true, message: '装箱单集装箱号不能为空', trigger: 'blur' }
        ],
        shelfLifeDays: [
          { required: true, message: '装箱单保质期天数不能为空', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    dialogTitle () {
      if (this.onlyEstimate) {
        if (this.readonly) {
          return '预售单详情'
        }
        return this.dataForm.id ? '修改预售单' : '新增预售单'
      }
      if (this.readonly) {
        return '客户订单确认详情'
      }
      return this.dataForm.id ? '修改客户订单确认' : '新增客户订单确认'
    },
    brandPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'BRAND'))
    },
    internalPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'INTERNAL'))
    },
    buyerPartnerList () {
      return this.partnerList.filter(item => this.hasBusinessRole(item, 'FUNDER') || this.hasBusinessRole(item, 'INTERNAL'))
    },
    productOptions () {
      return this.productList.map(item => {
        const name = item.productName || ''
        return {
          id: item.id,
          value: item.productCode,
          label: `${item.productCode}${name ? ' - ' + name : ''}`
        }
      })
    },
    hasConfirmData () {
      const confirm = this.dataForm.confirmInfo || {}
      return !!(confirm.contractNo || confirm.filePath || (confirm.itemList || []).length)
    },
    hasPackingData () {
      const packing = this.dataForm.packingInfo || {}
      return !!(packing.contractNo || packing.filePath || (packing.itemList || []).length)
    },
    hasCustomsData () {
      const customs = this.dataForm.customsInfo || {}
      return !!(customs.filePath || customs.fileName)
    },
    hasQuarantineData () {
      return (this.dataForm.quarantineList || []).length > 0
    },
    buyerPartnerRoleLabel () {
      return this.getBusinessRoleLabel(this.dataForm.confirmInfo.buyerPartnerRole)
    },
    confirmLineTotalInclTax () {
      return (this.dataForm.confirmInfo.itemList || []).reduce((sum, item) => {
        return sum + this.toNumber(item.lineTotalInclTax)
      }, 0)
    },
    confirmLineTotalExclTax () {
      return (this.dataForm.confirmInfo.itemList || []).reduce((sum, item) => {
        return sum + this.calcLineTotalExclTax(item)
      }, 0)
    },
    confirmAmountDiff () {
      const totalCents = Math.round(this.confirmLineTotalInclTax * 100)
      const amountCents = Math.round(this.toNumber(this.dataForm.confirmInfo.totalAmount) * 100)
      return totalCents !== amountCents
    },
    packingTotalBoxes () {
      return (this.dataForm.packingInfo.itemList || []).reduce((sum, item) => sum + this.toNumber(item.totalBoxes), 0)
    },
    packingTotalWeight () {
      return (this.dataForm.packingInfo.itemList || []).reduce((sum, item) => sum + this.toNumber(item.totalWeight), 0)
    },
    packingRecognizedTotalBoxes () {
      return this.toNumber((this.dataForm.packingInfo || {}).totalBoxes)
    },
    packingRecognizedTotalWeight () {
      return this.toNumber((this.dataForm.packingInfo || {}).totalWeight)
    },
    packingSummaryDiff () {
      return this.packingRecognizedTotalBoxes !== this.packingTotalBoxes ||
        Math.round(this.packingRecognizedTotalWeight * 100) !== Math.round(this.packingTotalWeight * 100)
    },
    packingExpandedKeys () {
      return (this.dataForm.packingInfo.itemList || []).map(item => this.packingRowKey(item))
    },
    presaleTotalWeightKg () {
      return (this.dataForm.itemList || []).reduce((sum, item) => {
        const kg = this.toNumber(item.quantityKg)
        if (kg) {
          return sum + kg
        }
        return sum + this.tonToKg(item.quantityTon)
      }, 0)
    },
    linkedConfirmRows () {
      return (this.dataForm.confirmList || []).map(confirm => {
        const row = Object.assign({}, confirm)
        row.confirmWeightKg = (confirm.itemList || []).reduce((sum, item) => {
          return sum + this.toNumber(item.quantity)
        }, 0)
        return row
      })
    },
    confirmTotalWeightKg () {
      return this.linkedConfirmRows.reduce((sum, item) => sum + this.toNumber(item.confirmWeightKg), 0)
    },
    remainingPresaleWeightKg () {
      return this.presaleTotalWeightKg - this.confirmTotalWeightKg
    },
    confirmWeightPercent () {
      if (!this.presaleTotalWeightKg) {
        return '0.00%'
      }
      return ((this.confirmTotalWeightKg / this.presaleTotalWeightKg) * 100).toFixed(2) + '%'
    }
  },
  methods: {
    init (id, readonly, activeTab, activeConfirmId) {
      this.visible = true
      this.readonly = !!readonly
      this.activeTab = this.onlyEstimate ? 'estimate' : (activeTab || 'estimate')
      this.dataForm = defaultForm()
      this.loadBaseOptions(() => {
        if (!id) return
        this.fetchOrderDetail(id, null, activeConfirmId)
      })
    },
    initFromEstimateResult (result) {
      this.visible = true
      this.readonly = false
      this.activeTab = 'estimate'
      this.detailLoading = true
      this.loadBaseOptions(() => {
        this.dataForm = this.buildEstimateForm(result)
        this.detailLoading = false
      })
    },
    initFromConfirmResult (orderId, result, activeConfirmId) {
      this.visible = true
      this.readonly = false
      this.activeTab = 'confirm'
      this.detailLoading = true
      this.loadBaseOptions(() => {
        this.fetchOrderDetail(orderId, (form) => {
          form.confirmInfo = this.buildConfirmInfo(result, activeConfirmId ? form.confirmInfo : defaultConfirmInfo())
          this.dataForm = form
        }, activeConfirmId)
      })
    },
    initFromPackingResult (orderId, result, activeConfirmId) {
      this.visible = true
      this.readonly = false
      this.activeTab = 'packing'
      this.detailLoading = true
      this.loadBaseOptions(() => {
        this.fetchOrderDetail(orderId, (form) => {
          form.packingInfo = this.buildPackingInfo(result, form.packingInfo, form.confirmInfo)
          if (activeConfirmId) {
            form.packingInfo.confirmId = activeConfirmId
          }
          this.dataForm = form
        }, activeConfirmId)
      })
    },
    fetchOrderDetail (id, callback, activeConfirmId) {
      this.detailLoading = true
      this.$http({
        url: this.$http.adornUrl(`/erp/presale/info/${id}`),
        method: 'get',
        params: this.$http.adornParams(activeConfirmId ? { confirmId: activeConfirmId } : {})
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const form = this.normalizeForm(data.presaleOrder || {})
          if (typeof callback === 'function') {
            callback(form)
          } else {
            this.dataForm = form
          }
        } else {
          this.$message.error((data && data.msg) || '获取详情失败')
        }
      }).finally(() => {
        this.detailLoading = false
      })
    },
    loadBaseOptions (callback) {
      this.loadPartners(() => {
        this.loadProducts(callback)
      })
    },
    loadPartners (callback) {
      this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.partnerList = (data && data.list) || []
        if (typeof callback === 'function') callback()
      })
    },
    loadProducts (callback) {
      this.$http({
        url: this.$http.adornUrl('/erp/product/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.productList = (data && data.list) || []
        if (typeof callback === 'function') callback()
      })
    },
    hasBusinessRole (item, role) {
      const businessRole = (item && item.businessRole) || ''
      return businessRole.split(',').map(value => value.trim()).indexOf(role) !== -1
    },
    getBusinessRoleLabel (roles) {
      if (!roles) return ''
      return roles.split(',').map(role => BIZ_ROLE_LABEL_MAP[role] || role).join(' / ')
    },
    resolveDefaultBrandName (brandName) {
      const sourceName = String(brandName || '').trim()
      if (!sourceName) return ''
      if (/silver\s*fern\s*farms/i.test(sourceName)) {
        return '银之蕨食品（上海）有限公司'
      }
      return sourceName
    },
    customerPartnerChange (value) {
      const target = this.findPartnerById(value)
      this.dataForm.customerReference = target ? target.partnerName : ''
    },
    normalizeForm (form) {
      const result = Object.assign(defaultForm(), form || {})
      if (!result.customerPartnerId && result.customerReference) {
        result.customerPartnerId = this.findPartnerIdByName(result.customerReference, ['INTERNAL'])
      }
      result.itemList = (form.itemList || []).map(item => {
        const row = Object.assign(defaultEstimateItem(), item)
        row._recognizedProductName = row.productName || ''
        row._recognizedProductNameEn = row.productNameEn || ''
        return row
      })
      result.confirmInfo = Object.assign(defaultConfirmInfo(), form.confirmInfo || {})
      result.confirmList = (form.confirmList || []).map(item => Object.assign(defaultConfirmInfo(), item))
      if (!result.confirmList.length && (result.confirmInfo.contractNo || result.confirmInfo.filePath || (result.confirmInfo.itemList || []).length)) {
        result.confirmList = [Object.assign(defaultConfirmInfo(), result.confirmInfo)]
      }
      result.confirmInfo.itemList = ((form.confirmInfo || {}).itemList || []).map(item => {
        const row = Object.assign(defaultConfirmItem(), item)
        row._recognizedProductName = row.productName || ''
        row._recognizedProductNameEn = row.productNameEn || ''
        this.fillConfirmProductByCode(row)
        return row
      })
      result.packingInfo = Object.assign(defaultPackingInfo(), form.packingInfo || {})
      result.customsInfo = Object.assign(defaultAttachmentInfo(), form.customsInfo || {})
      result.quarantineInfo = Object.assign(defaultAttachmentInfo(), form.quarantineInfo || {})
      result.quarantineList = (form.quarantineList || (form.quarantineInfo && form.quarantineInfo.filePath ? [form.quarantineInfo] : [])).map(item => Object.assign(defaultAttachmentInfo(), item))
      result.packingInfo.itemList = ((form.packingInfo || {}).itemList || []).map(item => {
        const row = Object.assign(defaultPackingItem(), item)
        row._recognizedProductName = row.productName || ''
        row._recognizedProductNameEn = row.productNameEn || ''
        row.batchList = (item.batchList || []).map(batch => Object.assign(defaultPackingBatch(), batch))
        this.recalculatePackingItemFromBatches(row)
        if (row.productCode) {
          this.fillEstimateProductByCode(row)
        }
        return row
      })
      return result
    },
    buildEstimateForm (result) {
      const draft = (result && result.orderDraft) || {}
      const resolvedBrandName = this.resolveDefaultBrandName(draft.brandName)
      const form = defaultForm()
      form.sellerContractNo = draft.contractNo || ''
      form.customerReference = draft.partnerName || ''
      form.customerPartnerId = this.findPartnerIdByName(form.customerReference, ['INTERNAL'])
      form.brandId = this.findPartnerIdByName(resolvedBrandName, ['BRAND'])
      form.brandName = resolvedBrandName
      form.estimateFilePath = result.savedFilePath || ''
      form.estimateFileName = this.extractFileName(result.savedFilePath)
      form.estimateRawText = result.rawText || ''
      form.currency = draft.currency || 'CNY'
      form.orderDate = draft.orderDate || new Date()
      form.expectedDate = draft.expectedDate || null
      form.remark = ''
      form.itemList = (draft.itemList || []).map(item => this.buildEstimateItem(item))
      return form
    },
    buildEstimateItem (item) {
      const row = defaultEstimateItem()
      const ton = this.toNumber(item.quantityTon != null ? item.quantityTon : this.kgToTon(item.quantityKg || item.quantity || item.estimatedWeight))
      const kg = this.toNumber(item.quantityKg != null ? item.quantityKg : item.quantity || item.estimatedWeight || this.tonToKg(ton))
      row.sourceProductCode = item.sourceProductCode || item.productCode || ''
      row.productCode = item.productCode || item.sourceProductCode || ''
      row.productName = item.productName || ''
      row.productNameEn = item.productNameEn || ''
      row._recognizedProductName = row.productName
      row._recognizedProductNameEn = row.productNameEn
      row.quantityTon = ton
      row.quantityKg = kg
      row.priceAmount = this.toNumber(item.priceAmount != null ? item.priceAmount : item.unitPrice)
      row.priceCurrency = item.priceCurrency || item.currency || 'CNY'
      row.priceUnit = item.priceUnit || item.unit || 'KG'
      row.remark = item.remark || ''
      return row
    },
    buildConfirmInfo (result, baseConfirm) {
      const draft = (result && result.orderDraft) || {}
      const confirm = Object.assign(defaultConfirmInfo(), baseConfirm || {})
      confirm.brandId = this.findPartnerIdByName(draft.brandName, ['BRAND']) || confirm.brandId
      confirm.brandName = draft.brandName || confirm.brandName
      confirm.buyerPartnerId = this.findPartnerIdByName(draft.buyerPartnerName || draft.partnerName, ['FUNDER', 'INTERNAL']) || confirm.buyerPartnerId
      confirm.buyerPartnerName = draft.buyerPartnerName || draft.partnerName || confirm.buyerPartnerName
      confirm.buyerPartnerRole = this.findPartnerRole(confirm.buyerPartnerId) || confirm.buyerPartnerRole
      confirm.contractNo = draft.contractNo || confirm.contractNo
      confirm.containerNo = draft.containerNo || confirm.containerNo
      confirm.expectedArrivalDate = draft.expectedDate || confirm.expectedArrivalDate
      confirm.totalAmount = this.toNumber(draft.totalAmount)
      confirm.currency = draft.currency || 'CNY'
      confirm.filePath = result.savedFilePath || ''
      confirm.fileName = this.extractFileName(result.savedFilePath)
      confirm.rawText = result.rawText || ''
      confirm.remark = confirm.remark || ''
      confirm.itemList = (draft.itemList || []).map(item => this.buildConfirmItem(item))
      return confirm
    },
    buildConfirmItem (item) {
      const row = defaultConfirmItem()
      const quantity = this.toNumber(item.quantity)
      const unitPriceInclTax = this.toNumber(item.unitPriceInclTax != null ? item.unitPriceInclTax : item.unitPrice)
      let lineTotal = this.toNumber(item.lineTotalInclTax != null ? item.lineTotalInclTax : item.lineTotal)
      if (!lineTotal && quantity && unitPriceInclTax) {
        lineTotal = Number((quantity * unitPriceInclTax).toFixed(2))
      }
      row.sourceProductCode = item.sourceProductCode || item.productCode || ''
      row.productCode = this.normalizeProductCode(item.productCode || item.sourceProductCode || '')
      row.productName = item.productName || ''
      row.productNameEn = item.productNameEn || ''
      row._recognizedProductName = row.productName
      row._recognizedProductNameEn = row.productNameEn
      row.unit = item.unit || 'KG'
      row.quantity = quantity
      row.unitPriceInclTax = unitPriceInclTax
      row.lineTotalInclTax = lineTotal
      row.taxRate = this.toNumber(item.taxRate || 9)
      row.remark = item.remark || ''
      this.fillConfirmProductByCode(row)
      return row
    },
    buildPackingInfo (result, basePacking, confirmInfo) {
      const draft = (result && result.packingDraft) || {}
      const packing = Object.assign(defaultPackingInfo(), basePacking || {})
      const confirmItems = ((confirmInfo || {}).itemList || []).map(item => Object.assign({}, item))
      const usedConfirmIndexes = new Set()
      packing.contractNo = draft.contractNo || packing.contractNo
      packing.containerNo = draft.containerNo || packing.containerNo
      packing.shelfLifeDays = this.toNumber(draft.shelfLifeDays)
      packing.totalBoxes = this.toNumber(draft.totalBoxes)
      packing.totalWeight = this.toNumber(draft.totalWeight)
      packing.filePath = result.savedFilePath || ''
      packing.fileName = this.extractFileName(result.savedFilePath)
      packing.rawText = result.rawText || ''
      packing.itemList = (draft.itemList || []).map(item => this.buildPackingItem(item, confirmItems, usedConfirmIndexes))
      return packing
    },
    buildPackingItem (item, confirmItems, usedConfirmIndexes) {
      const row = defaultPackingItem()
      row.sourceProductCode = item.sourceProductCode || item.productCode || ''
      row.productCode = ''
      row.productName = item.productName || ''
      row.productNameEn = item.productNameEn || ''
      row.factoryNo = item.factoryNo || ''
      row._recognizedProductName = row.productName
      row._recognizedProductNameEn = row.productNameEn
      row.totalBoxes = this.toNumber(item.totalBoxes)
      row.totalWeight = this.toNumber(item.totalWeight)
      row.shelfLifeDays = this.toNumber(item.shelfLifeDays)
      this.fillPackingProductByCode(row)
      if (!row.productCode || !row.productNameEn) {
        this.fillPackingProductByConfirmItem(row, confirmItems, usedConfirmIndexes)
      }
      if (!row.productCode) {
        this.fillPackingProductByEnglishName(row)
      }
      row.batchList = (item.batchList || []).map((batch) => {
        const batchRow = defaultPackingBatch()
        batchRow.productionDate = batch.productionDate || ''
        batchRow.expiryDate = batch.expiryDate || ''
        batchRow.boxCount = this.toNumber(batch.boxCount)
        batchRow.weight = this.toNumber(batch.weight)
        return batchRow
      })
      this.recalculatePackingItemFromBatches(row)
      return row
    },
    packingRowKey (row) {
      return [row.id || 0, row.productCode || '', row.productNameEn || ''].join('_')
    },
    findProductByCode (code) {
      if (!code) return null
      return this.productList.find(item => String(item.productCode) === String(code)) || null
    },
    ensureProductOption (row, product) {
      if (!row || !product) return
      const exists = (row._productOptions || []).some(item => String(item.productCode) === String(product.productCode))
      if (!exists) {
        row._productOptions = [product].concat(row._productOptions || [])
      }
    },
    productSelectVisibleChange (row, visible) {
      if (!visible || this.readonly) {
        return
      }
      row._productKeyword = row.productCode || row.sourceProductCode || row._recognizedProductName || row._recognizedProductNameEn || ''
      this.fetchRowProductOptions(row)
    },
    remoteSearchProducts (row, keyword) {
      row._productKeyword = keyword
      this.fetchRowProductOptions(row)
    },
    fetchRowProductOptions (row) {
      row._productLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/product/selectPage'),
        method: 'get',
        params: this.$http.adornParams({
          page: 1,
          limit: 15,
          keyword: row._productKeyword || ''
        })
      }).then(({ data }) => {
        if (data && data.code === 0) {
          row._productOptions = (data.page.list || []).map(item => Object.assign({}, item))
          const currentProduct = this.findProductByCode(row.productCode)
          this.ensureProductOption(row, currentProduct)
        } else {
          row._productOptions = []
          this.$message.error((data && data.msg) || '鑾峰彇浜у搧鍒楄〃澶辫触')
        }
      }).catch(() => {
        row._productOptions = []
      }).finally(() => {
        row._productLoading = false
      })
    },
    productSelectChange (row, value) {
      if (!value) {
        row.productCode = ''
        row.productName = row._recognizedProductName || ''
        row.productNameEn = row._recognizedProductNameEn || ''
        if (Object.prototype.hasOwnProperty.call(row, 'marketCirculationName')) {
          row.marketCirculationName = ''
        }
        return
      }
      const product = (row._productOptions || []).find(item => String(item.productCode) === String(value)) ||
        this.findProductByCode(value)
      if (!product) {
        row.productCode = ''
        row.productName = row._recognizedProductName || ''
        row.productNameEn = row._recognizedProductNameEn || ''
        if (Object.prototype.hasOwnProperty.call(row, 'marketCirculationName')) {
          row.marketCirculationName = ''
        }
        return
      }
      row.productCode = product.productCode || ''
      if (Object.prototype.hasOwnProperty.call(row, 'sourceProductCode') && !row.sourceProductCode) {
        row.sourceProductCode = product.productCode || ''
      }
      row.productName = product.productName || row._recognizedProductName || ''
      row.productNameEn = product.productNameEn || row._recognizedProductNameEn || ''
      if (Object.prototype.hasOwnProperty.call(row, 'marketCirculationName')) {
        row.marketCirculationName = product.marketCirculationName || ''
      }
      this.ensureProductOption(row, product)
    },
    findProductByEnglishName (name) {
      const normalized = this.normalizeEnglishName(name)
      if (!normalized) return null
      return this.productList.find(item => this.normalizeEnglishName(item.productNameEn) === normalized) || null
    },
    fillEstimateProductByCode (row) {
      const product = this.findProductByCode(row.productCode)
      if (!product) return
      row.productName = product.productName || row.productName || ''
      row.productNameEn = product.productNameEn || row.productNameEn || ''
      this.ensureProductOption(row, product)
    },
    fillConfirmProductByCode (row) {
      const product = this.findProductByCode(row.productCode)
      if (!product) return
      row.productName = product.productName || row.productName || ''
      row.productNameEn = product.productNameEn || row.productNameEn || ''
      row.marketCirculationName = product.marketCirculationName || ''
      this.ensureProductOption(row, product)
    },
    fillPackingProductByEnglishName (row) {
      const product = this.findProductByEnglishName(row.productNameEn)
      if (!product) return
      row.productCode = product.productCode || row.productCode || ''
      row.sourceProductCode = row.sourceProductCode || product.productCode || ''
      row.productName = product.productName || row.productName || ''
      row.productNameEn = product.productNameEn || row.productNameEn || ''
      this.ensureProductOption(row, product)
    },
    fillPackingProductByCode (row) {
      const product = this.findProductByCode(row.productCode || row.sourceProductCode)
      if (!product) return
      row.productCode = product.productCode || row.productCode || ''
      row.sourceProductCode = row.sourceProductCode || product.productCode || ''
      row.productName = product.productName || row.productName || ''
      row.productNameEn = product.productNameEn || row.productNameEn || ''
      this.ensureProductOption(row, product)
    },
    fillPackingProductByConfirmItem (row, confirmItems, usedConfirmIndexes) {
      if (!confirmItems || !confirmItems.length) return
      const normalizedRowName = this.normalizeEnglishName(row.productNameEn)
      const rowWeight = this.toNumber(row.totalWeight)
      const isSameWeight = (value) => Math.abs(this.toNumber(value) - rowWeight) < 0.01
      const isNameMatch = (value) => {
        const normalizedValue = this.normalizeEnglishName(value)
        return normalizedValue && normalizedRowName &&
          (normalizedValue === normalizedRowName ||
            normalizedValue.indexOf(normalizedRowName) !== -1 ||
            normalizedRowName.indexOf(normalizedValue) !== -1)
      }
      const matchIndex = confirmItems.findIndex((item, index) =>
        !usedConfirmIndexes.has(index) &&
        isSameWeight(item.quantity) &&
        (isNameMatch(item.productNameEn) || isNameMatch(item.productName))
      )
      if (matchIndex === -1) return
      const matchedItem = confirmItems[matchIndex]
      usedConfirmIndexes.add(matchIndex)
      row.productCode = matchedItem.productCode || row.productCode || ''
      row.sourceProductCode = matchedItem.sourceProductCode || matchedItem.productCode || row.sourceProductCode || ''
      row.productName = matchedItem.productName || row.productName || ''
      row.productNameEn = matchedItem.productNameEn || row.productNameEn || ''
      this.ensureProductOption(row, this.findProductByCode(row.productCode))
    },
    handlePackingProductChange (row) {
      const product = this.findProductByCode(row.productCode)
      if (!product) {
        row.sourceProductCode = ''
        row.productName = ''
        row.productNameEn = ''
        return
      }
      row.sourceProductCode = product.productCode || row.sourceProductCode || ''
      row.productName = product.productName || row.productName || ''
      row.productNameEn = product.productNameEn || row.productNameEn || ''
    },
    handlePackingBatchChange (row) {
      this.recalculatePackingItemFromBatches(row)
    },
    addPackingItemRow () {
      const itemList = this.dataForm.packingInfo.itemList || (this.dataForm.packingInfo.itemList = [])
      const row = defaultPackingItem()
      row.shelfLifeDays = this.toNumber(this.dataForm.packingInfo.shelfLifeDays)
      row.batchList = [defaultPackingBatch()]
      itemList.push(row)
      this.$nextTick(() => {
        this.recalculatePackingItemFromBatches(row)
      })
    },
    removePackingItemRow (index) {
      const itemList = this.dataForm.packingInfo.itemList || []
      itemList.splice(index, 1)
    },
    addConfirmItemRow () {
      const confirmInfo = this.dataForm.confirmInfo || (this.dataForm.confirmInfo = defaultConfirmInfo())
      const itemList = confirmInfo.itemList || (confirmInfo.itemList = [])
      itemList.push(defaultConfirmItem())
    },
    removeConfirmItemRow (index) {
      const itemList = (this.dataForm.confirmInfo || {}).itemList || []
      itemList.splice(index, 1)
    },
    addPackingBatchRow (row) {
      const batchList = row.batchList || (row.batchList = [])
      const lastRow = batchList.length ? batchList[batchList.length - 1] : {}
      batchList.push({
        id: 0,
        productionDate: lastRow.productionDate || '',
        expiryDate: lastRow.expiryDate || '',
        boxCount: '',
        weight: 0
      })
      this.recalculatePackingItemFromBatches(row)
    },
    removePackingBatchRow (row, index) {
      const batchList = row.batchList || []
      batchList.splice(index, 1)
      this.recalculatePackingItemFromBatches(row)
    },
    recalculatePackingItemFromBatches (row) {
      const batchList = row.batchList || []
      if (!batchList.length) {
        row.totalBoxes = 0
        return
      }
      row.totalBoxes = batchList.reduce((sum, batch) => sum + this.toNumber(batch.boxCount), 0)
    },
    validatePackingRequired (payload) {
      if (!payload.packingInfo || !payload.packingInfo.itemList || !payload.packingInfo.itemList.length) {
        return true
      }
      const packingInfo = payload.packingInfo
      if (!packingInfo.contractNo) {
        this.activeTab = 'packing'
        this.$message.error('装箱单合同号不能为空')
        return false
      }
      if (!packingInfo.containerNo) {
        this.activeTab = 'packing'
        this.$message.error('装箱单集装箱号不能为空')
        return false
      }
      if (packingInfo.shelfLifeDays === '' || packingInfo.shelfLifeDays === null || packingInfo.shelfLifeDays === undefined) {
        this.activeTab = 'packing'
        this.$message.error('装箱单保质期天数不能为空')
        return false
      }
      for (let i = 0; i < packingInfo.itemList.length; i++) {
        const item = packingInfo.itemList[i]
        if (!item.factoryNo) {
          this.activeTab = 'packing'
          this.$message.error(`装箱单第 ${i + 1} 行厂号不能为空`)
          return false
        }
        if (item.totalWeight === '' || item.totalWeight === null || item.totalWeight === undefined) {
          this.activeTab = 'packing'
          this.$message.error(`装箱单第 ${i + 1} 行总重量不能为空`)
          return false
        }
        const batchList = item.batchList || []
        for (let j = 0; j < batchList.length; j++) {
          const batch = batchList[j]
          if (!batch.productionDate) {
            this.activeTab = 'packing'
            this.$message.error(`装箱单第 ${i + 1} 行第 ${j + 1} 条生产日期不能为空`)
            return false
          }
          if (!batch.expiryDate) {
            this.activeTab = 'packing'
            this.$message.error(`装箱单第 ${i + 1} 行第 ${j + 1} 条过期日期不能为空`)
            return false
          }
          if (batch.boxCount === '' || batch.boxCount === null || batch.boxCount === undefined) {
            this.activeTab = 'packing'
            this.$message.error(`装箱单第 ${i + 1} 行第 ${j + 1} 条箱数不能为空`)
            return false
          }
        }
      }
      return true
    },
    validatePackingSelection (payload) {
      if (!payload.packingInfo || !payload.packingInfo.itemList || !payload.packingInfo.itemList.length) {
        return true
      }
      const invalidIndex = payload.packingInfo.itemList.findIndex(item => !item.productCode)
      if (invalidIndex !== -1) {
        this.activeTab = 'packing'
        this.$message.error(`装箱单第 ${invalidIndex + 1} 行产品未选择，无法保存`)
        return false
      }
      return true
    },
    handleEstimateProductChange (row) {
      this.fillEstimateProductByCode(row)
    },
    handleConfirmProductChange (row) {
      this.fillConfirmProductByCode(row)
    },
    setActiveConfirm (row) {
      const confirm = Object.assign(defaultConfirmInfo(), row || {})
      confirm.itemList = ((row || {}).itemList || []).map(item => {
        const itemRow = Object.assign(defaultConfirmItem(), item)
        this.fillConfirmProductByCode(itemRow)
        return itemRow
      })
      this.dataForm.confirmInfo = confirm
    },
    isActiveConfirm (row) {
      const active = this.dataForm.confirmInfo || {}
      if (active.id && row && row.id) {
        return String(active.id) === String(row.id)
      }
      return !!(row && active.contractNo && row.contractNo && String(active.contractNo) === String(row.contractNo))
    },
    setActiveConfirmFromSummary (row) {
      this.linkedConfirmDetail = Object.assign({}, row)
      this.linkedConfirmDetailVisible = true
    },
    addEstimateItemRow () {
      const itemList = this.dataForm.itemList || (this.dataForm.itemList = [])
      itemList.push(defaultEstimateItem())
    },
    removeEstimateItemRow (index) {
      const itemList = this.dataForm.itemList || []
      itemList.splice(index, 1)
    },
    validateEstimateRequired (payload) {
      if (!payload.brandId) {
        this.activeTab = 'estimate'
        this.$message.error('请选择预售销售单品牌方')
        return false
      }
      if (!payload.sellerContractNo) {
        this.activeTab = 'estimate'
        this.$message.error('预售销售单合同号不能为空')
        return false
      }
      if (!payload.customerPartnerId) {
        this.activeTab = 'estimate'
        this.$message.error('请选择预售销售单采购方')
        return false
      }
      if (!payload.orderDate) {
        this.activeTab = 'estimate'
        this.$message.error('预售销售单下单日期不能为空')
        return false
      }
      const itemList = payload.itemList || []
      if (!itemList.length) {
        this.activeTab = 'estimate'
        this.$message.error('预售销售单明细至少需要一行')
        return false
      }
      const invalidIndex = itemList.findIndex(item => !String(item.productCode || item.sourceProductCode || '').trim())
      if (invalidIndex !== -1) {
        this.activeTab = 'estimate'
        this.$message.error(`预售销售单第 ${invalidIndex + 1} 行产品代码不能为空`)
        return false
      }
      return true
    },
    calcLineTotalExclTax (row) {
      const total = this.toNumber(row.lineTotalInclTax)
      const taxRate = this.toNumber(row.taxRate || 9)
      const divisor = 1 + taxRate / 100
      if (!divisor) return 0
      return Number((total / divisor).toFixed(2))
    },
    normalizeProductCode (code) {
      if (!code) return ''
      return String(code).replace(/[A-Za-z]+$/g, '')
    },
    normalizeEnglishName (value) {
      if (!value) return ''
      return String(value)
        .replace(/^(SYB[-\s]+)/i, '')
        .replace(/[^A-Za-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ')
        .toUpperCase()
    },
    tonToKg (value) {
      return this.toNumber(value) * 1000
    },
    kgToTon (value) {
      return this.toNumber(value) / 1000
    },
    toNumber (value) {
      const num = Number(value)
      return Number.isFinite(num) ? num : 0
    },
    formatDateOnly (value) {
      return value ? String(value).slice(0, 10) : ''
    },
    money (value, digits = 2) {
      return this.toNumber(value).toFixed(digits)
    },
    findPartnerIdByName (name, roles) {
      if (!name) return ''
      const target = this.partnerList.find(item => {
        if (item.partnerName !== name) return false
        if (!roles || !roles.length) return true
        return roles.some(role => this.hasBusinessRole(item, role))
      })
      return target ? target.id : ''
    },
    findPartnerById (id) {
      return this.partnerList.find(item => String(item.id) === String(id))
    },
    findPartnerRole (id) {
      const target = this.partnerList.find(item => String(item.id) === String(id))
      return target ? target.businessRole : ''
    },
    extractFileName (path) {
      if (!path) return ''
      const parts = String(path).split(/[\\/]/)
      return parts[parts.length - 1]
    },
    formatDateTime (value) {
      if (!value) return ''
      return String(value).replace('T', ' ').slice(0, 19)
    },
    downloadFile (url) {
      const token = this.$cookie.get('token') || ''
      const link = `${window.SITE_CONFIG.baseUrl}${url}?token=${encodeURIComponent(token)}`
      window.open(link, '_blank')
    },
    reuploadAttachment (type) {
      this.attachmentUploadType = type
      this.attachmentUploadVisible = true
      this.$nextTick(() => {
        this.$refs.attachmentUploadDialog.init()
      })
    },
    attachmentUploadedHandle () {
      this.attachmentUploadVisible = false
      if (!this.dataForm.id) {
        return
      }
      const currentTab = this.attachmentUploadType
      this.activeTab = currentTab
      this.fetchOrderDetail(this.dataForm.id, null, (this.dataForm.confirmInfo || {}).id)
    },
    submitHandle () {
      if (this.saveLoading) {
        return
      }
      const url = this.dataForm.id ? '/erp/presale/update' : '/erp/presale/save'
      const payload = JSON.parse(JSON.stringify(this.dataForm))
      if (!this.validateEstimateRequired(payload)) {
        return
      }
      if (!payload.confirmInfo || !this.hasConfirmData) {
        payload.confirmInfo = null
      }
      if (!payload.packingInfo || !this.hasPackingData) {
        payload.packingInfo = null
      }
      if (!this.validatePackingSelection(payload)) {
        return
      }
      if (!this.validatePackingRequired(payload)) {
        return
      }
      const submitRequest = () => {
        this.saveLoading = true
        this.$http({
          url: this.$http.adornUrl(url),
          method: 'post',
          data: this.$http.adornData(payload)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('保存成功')
            this.visible = false
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '保存失败')
          }
        }).finally(() => {
          this.saveLoading = false
        })
      }
      if (payload.confirmInfo && this.$refs.confirmForm) {
        this.$refs.confirmForm.validate((valid) => {
          if (!valid) {
            return
          }
          submitRequest()
        })
        return
      }
      submitRequest()
    }
  }
}
</script>

<style>
.presale-order-dialog-modal {
  margin-bottom: 0;
}

.presale-order-dialog-modal .el-dialog__body {
  padding: 16px 20px 0;
}
</style>

<style scoped>
.presale-order-dialog {
  height: 78vh;
  overflow: hidden;
}

.presale-order-dialog /deep/ .presale-order-tabs {
  height: 100%;
}

.presale-order-dialog /deep/ .el-tabs__content {
  height: calc(100% - 55px);
  overflow: hidden;
}

.presale-order-dialog /deep/ .el-tab-pane {
  height: 100%;
}

.tab-pane-content,
.tab-pane-content-body {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-scroll-area {
  flex: 0 0 auto;
  margin-bottom: 10px;
  max-height: 240px;
  overflow-x: hidden;
  overflow-y: auto;
}

.tab-tools {
  margin-bottom: 10px;
  flex: 0 0 auto;
}

.confirm-list-panel {
  flex: 0 0 auto;
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px solid #d7ebe8;
  border-radius: 8px;
  background: #f5fbfa;
}

.confirm-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #1f5f73;
  font-weight: 700;
}

.confirm-list-table {
  width: 100%;
}

.confirm-list-table /deep/ .el-tag {
  margin-right: 6px;
}

.linked-confirm-summary {
  flex: 0 0 auto;
  margin-bottom: 12px;
}

.summary-card {
  padding: 12px 14px;
  border: 1px solid #d7ebe8;
  border-radius: 8px;
  background: #f5fbfa;
}

.summary-card.is-warning {
  border-color: #fbc4c4;
  background: #fef0f0;
}

.summary-label {
  margin-bottom: 6px;
  color: #607d8b;
  font-size: 12px;
}

.summary-value {
  color: #1f5f73;
  font-size: 18px;
  font-weight: 700;
}

.summary-card.is-warning .summary-value {
  color: #f56c6c;
}

.linked-confirm-alert {
  margin-top: 10px;
}

.linked-confirm-detail-table {
  margin-top: 14px;
}

.linked-confirm-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid #ebeef5;
  border-left: 1px solid #ebeef5;
}

.detail-cell {
  display: flex;
  min-height: 42px;
  border-right: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.detail-cell span {
  flex: 0 0 118px;
  padding: 11px 10px;
  color: #606266;
  background: #fafafa;
}

.detail-cell strong {
  flex: 1 1 auto;
  min-width: 0;
  padding: 11px 10px;
  color: #303133;
  font-weight: 500;
  word-break: break-all;
}

.confirm-summary {
  position: absolute;
  top: -34px;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  pointer-events: none;
}

.confirm-table-wrap {
  position: relative;
  flex: 1 1 auto;
  min-height: 260px;
  display: flex;
  flex-direction: column;
  padding-top: 12px;
}

.confirm-table-wrap /deep/ .confirm-item-table {
  flex: 1 1 auto;
}

.confirm-summary-line {
  font-size: 13px;
  width: 300px;
  text-align: left;
  display: block;
  
  font-size: 12px;
  color: #f56c6c;
}

.confirm-warning {
  display: block;
  width: 300px;
  text-align: left;
  color: #606266;
  font-weight: 700;
}

.packing-summary-warning {
  margin-bottom: 10px;
  color: #f56c6c;
  font-size: 12px;
}

.packing-batch-toolbar {
  margin-bottom: 8px;
  text-align: right;
}

.estimate-item-toolbar,
.confirm-item-toolbar,
.packing-item-toolbar {
  margin-bottom: 10px;
  text-align: right;
}

.packing-summary-form /deep/ .el-form-item__label {
  white-space: nowrap;
}

.packing-summary-form /deep/ .el-input {
  width: calc(100% - 12px);
}

.required-column-label::before {
  content: '*';
  color: #f56c6c;
  margin-right: 4px;
}

.product-option-code {
  color: #303133;
  font-weight: 600;
  line-height: 18px;
}

.product-option-name {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
</style>
