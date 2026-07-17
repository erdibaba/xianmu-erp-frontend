<template>
  <el-dialog
    :title="dialogTitle"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="96%"
    top="3vh"
    custom-class="sale-order-dialog-modal">
    <div ref="saleOrderScroll" class="sale-order-dialog" v-loading.fullscreen.lock="dialogLoading">
      <el-form
        ref="dataForm"
        :model="dataForm"
        :rules="dataRule"
        label-width="110px"
        @keyup.enter.native="dataFormSubmit()">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="销售主体" prop="sellingEntityId">
              <el-select
                v-model="dataForm.sellingEntityId"
                :disabled="contentReadonly"
                filterable
                style="width: 100%;"
                placeholder="请选择销售主体"
                @change="sellingEntityChangeHandle">
                <el-option
                  v-for="item in internalEntityList"
                  :key="item.id"
                  :label="item.entityName"
                  :value="item.id">
                  <span>{{ item.entityName }}</span>
                  <el-tag v-if="Number(item.defaultFlag) === 1" size="mini" type="success" style="float:right;margin-top:6px;">默认</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售类型" prop="saleType">
              <el-select
                v-model="dataForm.saleType"
                :disabled="contentReadonly"
                style="width: 100%;"
                @change="saleTypeChangeHandle">
                <el-option label="期货单" value="FUTURES"></el-option>
                <el-option label="现货单" value="SPOT"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="二批商" prop="secondaryPartnerId">
              <el-select
                v-model="dataForm.secondaryPartnerId"
                :disabled="contentReadonly"
                filterable
                clearable
                style="width: 100%;"
                placeholder="请选择二批商"
                @change="secondaryPartnerChangeHandle">
                <el-option
                  v-for="item in secondaryPartnerList"
                  :key="item.id"
                  :label="item.partnerName"
                  :value="item.id">
                  <span>{{ item.partnerName }}</span>
                  <el-tag
                    v-if="item.riskLevel && item.riskLevel !== 'NORMAL'"
                    size="mini"
                    :type="partnerRiskTagType(item.riskLevel)"
                    style="float: right; margin-top: 6px;">
                    {{ partnerRiskLabel(item.riskLevel) }}
                  </el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="冷库减免时间">
              <el-input :value="coldStorageFreeDaysText" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="涉及仓库">
              <el-input :value="dataForm.warehouseName || (isSpotSale ? '按已选库存自动汇总' : '-')" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="销售" prop="salespersonId">
              <el-select
                v-model="dataForm.salespersonId"
                :disabled="contentReadonly"
                filterable
                remote
                clearable
                reserve-keyword
                style="width: 100%;"
                placeholder="输入销售姓名搜索"
                :loading="salespersonLoading"
                :remote-method="remoteSearchSalespersons"
                @visible-change="salespersonVisibleChange"
                @change="salespersonChangeHandle">
                <el-option
                  v-for="item in salespersonOptions"
                  :key="item.id"
                  :label="salespersonLabel(item)"
                  :value="item.id">
                  <div class="product-option-code">{{ item.salesName }}</div>
                  <div class="product-option-name">{{ item.mobile || '-' }} / {{ item.sysUsername || '未绑定账号' }}</div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同号">
              <el-input v-model="dataForm.contractNo" :disabled="contentReadonly"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="签订日期" prop="contractSignDate">
              <el-date-picker
                v-model="dataForm.contractSignDate"
                :disabled="contentReadonly"
                type="date"
                value-format="yyyy-MM-dd"
                format="yyyy-MM-dd"
                style="width: 100%;"
                placeholder="请选择签订日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="销售单号">
              <el-input v-model="dataForm.orderNo" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="流程状态">
              <el-input :value="statusLabel" disabled></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="收款方式">
              <el-select
                v-model="dataForm.paymentMode"
                :disabled="readonly || paymentModeLocked"
                style="width: 100%;"
                @change="paymentModeChangeHandle">
                <el-option label="分批付款" :value="1"></el-option>
                <el-option label="全款付款" :value="2"></el-option>
              </el-select>
              <div v-if="paymentModeLocked && !readonly" class="form-tip">已有出库批次，收款方式不可修改</div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="合同页面">
              <div class="contract-link-wrap">
                <el-button
                  v-if="dataForm.contractUrl"
                  type="text"
                  size="small"
                  @click="openContract()">
                  打开合同页面
                </el-button>
                <el-button
                  v-if="dataForm.contractUrl"
                  type="text"
                  size="small"
                  @click="previewContractPdf()">
                  预览PDF
                </el-button>
                <el-button
                  v-if="dataForm.contractUrl"
                  type="text"
                  size="small"
                  @click="copyContractUrl()">
                  复制链接
                </el-button>
                <span v-else>-</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="isFuturesSale" :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联预销售单" prop="sourcePresaleOrderId">
              <el-select
                v-model="dataForm.sourcePresaleOrderId"
                :disabled="contentReadonly"
                filterable
                clearable
                remote
                reserve-keyword
                style="width: 100%;"
                placeholder="输入预售合同号搜索"
                :loading="presaleOrderLoading"
                @visible-change="presaleOrderVisibleChange"
                :remote-method="remoteSearchPresaleOrders"
                @change="presaleOrderChangeHandle">
                <el-option
                  v-for="item in presaleOrderOptions"
                  :key="item.presaleOrderId"
                  :label="presaleOrderLabel(item)"
                  :value="item.presaleOrderId">
                  <div class="product-option-code">{{ presaleOrderLabel(item) }}</div>
                  <div class="product-option-name">{{ item.customerReference || '-' }} / {{ item.brandName || '-' }}</div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" :disabled="contentReadonly" type="textarea"></el-input>
        </el-form-item>

        <div v-if="isFuturesSale" class="sub-title">
          <span>期货产品明细</span>
          <div class="sub-title-actions">
            <el-button
              v-if="!contentReadonly"
              size="mini"
              type="primary"
              plain
              @click="addItemRow()">
              新增明细
            </el-button>
          </div>
        </div>

        <el-table v-if="isFuturesSale" :data="dataForm.itemList" border size="mini" class="item-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>

          <el-table-column label="产品编码" min-width="220">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.productId"
                filterable
                clearable
                remote
                reserve-keyword
                size="mini"
                :disabled="contentReadonly"
                :loading="scope.row._productLoading"
                placeholder="输入产品编码/中文/英文搜索"
                style="width: 100%;"
                @visible-change="visible => productSelectVisibleChange(scope.row, visible)"
                :remote-method="keyword => remoteSearchProducts(scope.row, keyword)"
                @change="value => productSelectChange(scope.row, value)">
                <el-option
                  v-for="item in scope.row._productOptions"
                  :key="item.id"
                  :label="item.productCode"
                  :value="item.id">
                  <div class="product-option-code">{{ item.productCode }}</div>
                  <div class="product-option-name">{{ item.marketCirculationName || item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="市场流通名称" min-width="160" show-overflow-tooltip>
            <template slot-scope="scope">{{ saleProductDisplayName(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="productSpec" label="规格" width="90"></el-table-column>
          <el-table-column prop="unit" label="单位" width="80"></el-table-column>

          <el-table-column label="箱数" width="100">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.boxes"
                :disabled="contentReadonly"
                :controls="false"
                :precision="0"
                :min="0"
                size="mini"
                style="width: 100%;"
                @change="spotTopRowChange(scope.row)">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column label="销售价（元/千克）" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.salePriceKg"
                :disabled="contentReadonly"
                :controls="false"
                :min="0"
                :precision="2"
                size="mini"
                style="width: 100%;"
                @change="spotSalePriceChange(scope.row)">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="数量/千克" width="130">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.contractQuantityKg"
                :disabled="contentReadonly"
                :controls="false"
                :min="0"
                :precision="2"
                size="mini"
                style="width: 100%;">
              </el-input-number>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="厂号" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractFactoryNo" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column v-if="isFuturesSale" label="港口/冷库" min-width="140">
            <template slot-scope="scope">
              <el-input v-model="scope.row.contractPortCold" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column label="备注" min-width="160">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="contentReadonly" size="mini"></el-input>
            </template>
          </el-table-column>

          <el-table-column v-if="!contentReadonly" label="操作" width="80" align="center">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="removeItemRow(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <template v-if="isSpotSale">
          <el-alert
            title="现货录单顺序：1. 查询产品  2. 选择该产品所在合同或具体批次  3. 录入销售价和预计重量  4. 保存销售单"
            type="info"
            :closable="false"
            show-icon
            class="spot-workflow-alert">
          </el-alert>
          <div class="sub-title spot-search-title">
            <span>查询可售库存</span>
            <span class="sub-title-tip">按确认函预计到港时间从早到晚展示；过期库存仍可选择，但会红色标记</span>
            <el-tag v-if="spotContractList.length" size="mini" type="success">查询到 {{ spotContractList.length }} 条合同</el-tag>
          </div>
          <div class="spot-search-bar">
            <el-select
              v-model="spotProductId"
              filterable
              remote
              clearable
              reserve-keyword
              :disabled="contentReadonly"
              :loading="spotProductLoading"
              :remote-method="remoteSearchSpotProducts"
              @change="spotProductChange"
              @visible-change="spotProductVisibleChange"
              placeholder="输入产品编码或市场流通名称搜索，最多15条"
              style="width: 520px;">
              <el-option
                v-for="item in spotProductOptions"
                :key="item.id"
                :label="`${item.productCode} / ${item.marketCirculationName || item.productName || '-'}`"
                :value="item.id">
                <div class="product-option-code">{{ item.productCode }}</div>
                <div class="product-option-name">{{ item.marketCirculationName || item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
              </el-option>
            </el-select>
            <el-button type="primary" :disabled="!spotProductId || contentReadonly" :loading="spotContractLoading" @click="searchSpotContracts">查询库存</el-button>
            <el-button type="success" plain :disabled="!spotPendingLotCount || contentReadonly" @click="addCheckedSpotLots">
              加入销售明细（{{ spotPendingLotCount }}）
            </el-button>
          </div>

          <el-table
            v-if="spotContractList.length"
            :key="spotContractTableVersion"
            ref="spotContractTable"
            v-loading="spotContractLoading"
            :data="spotContractList"
            height="300"
            border
            size="mini"
            row-key="_rowKey"
            class="spot-contract-table">
            <el-table-column type="expand" width="48">
              <template slot-scope="scope">
                <el-table
                  :ref="`spotLots_${scope.row._rowKey}`"
                  :data="scope.row.lotList || []"
                  border
                  size="mini"
                  row-key="_sourceKey"
                  @selection-change="selection => spotLotSelectionChange(scope.row, selection)">
                  <el-table-column v-if="!contentReadonly" type="selection" width="48" :selectable="spotLotSelectable"></el-table-column>
                  <el-table-column prop="warehouseName" label="仓库" min-width="140"></el-table-column>
                  <el-table-column prop="businessEntityName" label="业务归属" min-width="150"></el-table-column>
                  <el-table-column prop="ownershipName" label="货权" min-width="130"></el-table-column>
                  <el-table-column prop="factoryNo" label="厂号" width="100"></el-table-column>
                  <el-table-column label="生产日期" width="115"><template slot-scope="lotScope">{{ formatDateOnly(lotScope.row.productionDate) }}</template></el-table-column>
                  <el-table-column label="过期日期" width="115">
                    <template slot-scope="lotScope">
                      <span :class="{ 'expired-stock-text': Number(lotScope.row.expired || 0) === 1 }">{{ formatDateOnly(lotScope.row.expiryDate) }}</span>
                      <el-tag v-if="Number(lotScope.row.expired || 0) === 1" size="mini" type="danger">已过期</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="availableBoxes" label="可售箱数" width="90" align="right"></el-table-column>
                  <el-table-column prop="availableWeightKg" label="可售重量KG" width="120" align="right"></el-table-column>
                  <el-table-column prop="inboundDate" label="入库时间" width="115"><template slot-scope="lotScope">{{ formatDateOnly(lotScope.row.inboundDate) }}</template></el-table-column>
                </el-table>
              </template>
            </el-table-column>
            <el-table-column label="确认函合同号" min-width="145"><template slot-scope="scope">{{ scope.row.confirmContractNo || '-' }}</template></el-table-column>
            <el-table-column label="预计到港" width="115"><template slot-scope="scope">{{ formatDateOnly(scope.row.expectedArrivalDate) }}</template></el-table-column>
            <el-table-column label="产品编码" width="105"><template slot-scope="scope">{{ scope.row.productCode || '-' }}</template></el-table-column>
            <el-table-column label="市场流通名称" min-width="160"><template slot-scope="scope">{{ scope.row.marketCirculationName || scope.row.productName || '-' }}</template></el-table-column>
            <el-table-column label="柜号" min-width="125"><template slot-scope="scope">{{ scope.row.containerNo || '-' }}</template></el-table-column>
            <el-table-column label="厂号" min-width="110" show-overflow-tooltip><template slot-scope="scope">{{ scope.row.factoryNos || '-' }}</template></el-table-column>
            <el-table-column label="仓库" min-width="140" show-overflow-tooltip><template slot-scope="scope">{{ scope.row.warehouseNames || '-' }}</template></el-table-column>
            <el-table-column label="业务归属" min-width="150" show-overflow-tooltip><template slot-scope="scope">{{ scope.row.businessEntityNames || '-' }}</template></el-table-column>
            <el-table-column label="货权" min-width="130" show-overflow-tooltip><template slot-scope="scope">{{ scope.row.ownershipNames || '-' }}</template></el-table-column>
            <el-table-column label="可售箱数" width="90" align="right"><template slot-scope="scope">{{ scope.row.availableBoxes }}</template></el-table-column>
            <el-table-column label="可售重量KG" width="120" align="right"><template slot-scope="scope">{{ scope.row.availableWeightKg }}</template></el-table-column>
            <el-table-column v-if="!contentReadonly" label="选择合同" width="125" fixed="right" align="center">
              <template slot-scope="scope">
                <el-button
                  type="primary"
                  plain
                  size="mini"
                  @click="addSearchedProductStock(scope.row)">加入该产品</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="sub-title">
            <span>已选库存明细</span>
            <div class="sub-title-actions">
              <span class="sub-title-tip">销售箱数必填；销售价和预计重量可通过明细右侧按钮调整</span>
              <el-button v-if="(dataForm.allocationItemList || []).length" type="warning" plain size="mini" @click="goToSpotProductSummary">查看By产品销售汇总</el-button>
            </div>
          </div>
        </template>
        <el-table
          v-if="isSpotSale"
          :key="spotAllocationTableVersion"
          ref="spotAllocationTable"
          :data="dataForm.allocationItemList"
          height="300"
          border
          size="mini"
          class="allocation-table">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" min-width="120"></el-table-column>
          <el-table-column label="市场流通名称" min-width="160" show-overflow-tooltip>
            <template slot-scope="scope">{{ saleProductDisplayName(scope.row) }}</template>
          </el-table-column>
          <el-table-column prop="productNameEn" label="英文名称" min-width="220" show-overflow-tooltip></el-table-column>
          <el-table-column prop="availableBoxes" label="可售箱数" width="95" align="right"></el-table-column>
          <el-table-column label="销售箱数" width="105">
            <template slot-scope="scope"><el-input-number v-model="scope.row.boxes" :disabled="contentReadonly" :controls="false" :min="1" :max="scope.row.availableBoxes || 999999" :precision="0" size="mini" style="width:100%;" @change="spotAllocationBoxesChange(scope.row)"></el-input-number></template>
          </el-table-column>
          <el-table-column prop="ownershipName" label="货权" min-width="120" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.ownershipName || '-' }}</template>
          </el-table-column>
          <el-table-column prop="businessEntityName" label="业务归属" min-width="150" show-overflow-tooltip></el-table-column>
          <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="150" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.confirmContractNo || '-' }}</template>
          </el-table-column>
          <el-table-column prop="sourceContainerNo" label="柜号" min-width="120"></el-table-column>
          <el-table-column label="销售价（元/千克）" width="150" align="right">
            <template slot-scope="scope">{{ formatNumber(scope.row.salePriceKg, 2) }}</template>
          </el-table-column>
          <el-table-column prop="contractQuantityKg" label="预计重量KG" width="115" align="right"></el-table-column>
          <el-table-column prop="contractFactoryNo" label="厂号" width="100"></el-table-column>
          <el-table-column prop="warehouseName" label="仓库" min-width="140"></el-table-column>
          <el-table-column label="入库日期" width="120" align="center">
            <template slot-scope="scope">{{ formatDateOnly(scope.row.inboundDate) }}</template>
          </el-table-column>
          <el-table-column label="生产日期" width="120" align="center">
            <template slot-scope="scope">{{ formatDateOnly(scope.row.productionDate) }}</template>
          </el-table-column>
          <el-table-column label="过期日期" width="120" align="center">
            <template slot-scope="scope"><span :class="{ 'expired-stock-text': isExpiredDate(scope.row.expiryDate) }">{{ formatDateOnly(scope.row.expiryDate) }}</span></template>
          </el-table-column>
          <el-table-column v-if="!contentReadonly" label="操作" width="165" fixed="right">
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="editSpotProductPricing(scope.row)">调整价格/重量</el-button>
              <el-button type="text" size="small" @click="removeSpotAllocation(scope.$index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <template v-if="dataForm.id && (dataForm.riskAuditList || []).length">
          <div class="sub-title"><span>货物风控记录</span><span class="sub-title-tip">记录非先进先出判断、审核意见及被跳过的更早确认函库存</span></div>
          <el-table :data="dataForm.riskAuditList" border size="mini" row-key="id" class="risk-audit-table">
            <el-table-column label="操作" width="130" show-overflow-tooltip><template slot-scope="scope">{{ riskActionLabel(scope.row.actionType) }}</template></el-table-column>
            <el-table-column prop="operatorName" label="操作人" width="120"></el-table-column>
            <el-table-column label="操作时间" width="170"><template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template></el-table-column>
            <el-table-column prop="opinion" label="审核意见" min-width="180"><template slot-scope="scope">{{ scope.row.opinion || '-' }}</template></el-table-column>
            <el-table-column prop="riskReason" label="非先进先出说明" min-width="260" show-overflow-tooltip></el-table-column>
          </el-table>
        </template>

        <div v-if="dataForm.id" class="sub-title">合同与付款附件</div>
        <div v-if="dataForm.id" class="full-payment-summary">
          <div>
            <strong>客户全款付款：</strong>
            <el-tag size="mini" :type="isFullPaymentMode ? 'success' : 'info'">{{ paymentModeLabel }}</el-tag>
            <el-tag v-if="isFullPaymentMode" size="mini" :type="fullPaymentUploaded ? 'success' : 'warning'">
              {{ fullPaymentUploaded ? '水单已上传' : '待上传水单' }}
            </el-tag>
            <span v-if="isFullPaymentMode && fullPaymentAmountDiffVisible" class="bank-slip-diff-warning inline-warning">
              全款确认金额与销售单金额存在差异，请核对
            </span>
          </div>
          <el-button
            v-if="isFullPaymentMode"
            size="mini"
            type="primary"
            plain
            @click="openFullPaymentDialog">
            全款付款详情
          </el-button>
        </div>
        <el-tabs v-if="dataForm.id" value="signedContract">
          <el-tab-pane label="盖章合同" name="signedContract">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('SIGNED_CONTRACT')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('SIGNED_CONTRACT')">
                上传盖章合同
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('SIGNED_CONTRACT')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'SIGNED_CONTRACT'"
                @click="confirmStep('SIGNED_CONTRACT')">
                确认合同无误</el-button>
            </div>
            <el-table :data="getFileListByType('SIGNED_CONTRACT')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('SIGNED_CONTRACT')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane v-if="false" label="二批打款凭证" name="buyerPayment">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('BUYER_PAYMENT_PROOF')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('BUYER_PAYMENT_PROOF')">
                上传二批打款凭证
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('BUYER_PAYMENT_PROOF')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'BUYER_PAYMENT_PROOF'"
                @click="confirmStep('BUYER_PAYMENT_PROOF')">
                确认二批打款凭证
              </el-button>
            </div>
            <el-table :data="getFileListByType('BUYER_PAYMENT_PROOF')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('BUYER_PAYMENT_PROOF')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane v-if="false" label="二批来款水单" name="buyerBank">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('BUYER_BANK_SLIP')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('BUYER_BANK_SLIP')">
                上传二批来款水单
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('BUYER_BANK_SLIP')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'BUYER_BANK_SLIP'"
                @click="confirmStep('BUYER_BANK_SLIP')">
                确认二批来款水单
              </el-button>
            </div>
            <el-table :data="getFileListByType('BUYER_BANK_SLIP')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('BUYER_BANK_SLIP')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane v-if="false" label="资方打款凭证" name="funderPayment">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('FUNDER_PAYMENT_PROOF')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('FUNDER_PAYMENT_PROOF')">
                上传资方打款凭证
              </el-button>
              <el-button
                v-if="attachmentEditable && canConfirmStep('FUNDER_PAYMENT_PROOF')"
                size="mini"
                type="success"
                :loading="confirmLoading && currentConfirmType === 'FUNDER_PAYMENT_PROOF'"
                @click="confirmStep('FUNDER_PAYMENT_PROOF')">
                确认资方打款凭证
              </el-button>
            </div>
            <el-table :data="getFileListByType('FUNDER_PAYMENT_PROOF')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('FUNDER_PAYMENT_PROOF')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane class="outbound-receipt-pane" label="出库批次" name="outboundReceipt">
            <div class="outbound-batch-panel">
              <div class="outbound-flow-card">
                <div class="outbound-flow-header">
                  <div>
                    <strong>出库批次流程</strong>
                    <span class="sub-title-tip">{{ outboundWorkflowTip }}</span>
                  </div>
                  <div class="outbound-flow-tags">
                    <el-tag v-if="currentOutboundBatch" size="small" type="info">
                      当前批次：{{ currentOutboundBatch.batchNo }}
                    </el-tag>
                    <el-tag v-if="currentOutboundBatch" size="small" :type="currentOutboundBatchTagType">
                      {{ formatOutboundBatchStatus(currentOutboundBatch.status) }}
                    </el-tag>
                    <el-tag v-if="outboundCompleted" size="small" type="success">整单出库已完成</el-tag>
                  </div>
                </div>
                <el-steps :active="outboundWorkflowActiveStep" finish-status="success" simple class="outbound-flow-steps">
                  <el-step title="创建批次"></el-step>
                  <el-step title="上传出库回单"></el-step>
                  <el-step title="上传来款水单"></el-step>
                  <el-step title="确认批次完成"></el-step>
                </el-steps>
                <div class="outbound-flow-actions">
                  <el-button
                    v-if="attachmentEditable && !outboundCompleted"
                    size="mini"
                    type="primary"
                    :loading="outboundBatchLoading"
                    @click="openOutboundBatchDialog">
                    新增出库批次
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && currentOutboundBatch && canUploadStep('OUTBOUND_RECEIPT')"
                    size="mini"
                    type="primary"
                    plain
                    :loading="uploadLoading && currentUploadType === 'OUTBOUND_RECEIPT'"
                    @click="triggerUpload('OUTBOUND_RECEIPT')">
                    上传出库回单识别
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && dataForm.outboundReceipt"
                    size="mini"
                    type="primary"
                    plain
                    :loading="outboundSaveLoading"
                    :disabled="isStepConfirmed('OUTBOUND_RECEIPT')"
                    @click="saveOutboundReceipt()">
                    保存出库回单
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && currentOutboundBatch && canUploadStep('OUTBOUND_BATCH_BANK_SLIP')"
                    size="mini"
                    type="primary"
                    plain
                    :loading="uploadLoading && currentUploadType === 'OUTBOUND_BATCH_BANK_SLIP'"
                    @click="triggerUpload('OUTBOUND_BATCH_BANK_SLIP')">
                    {{ outboundBankSlipUploadLabel }}
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && currentOutboundBatch && currentOutboundBatchEditable"
                    size="mini"
                    type="primary"
                    plain
                    :loading="outboundBatchLoading"
                    @click="bindOutboundScanLink">
                    新增扫码链接
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && currentOutboundBatch && canConfirmOutboundBatch"
                    size="mini"
                    type="success"
                    :loading="confirmLoading && currentConfirmType === 'OUTBOUND_BATCH'"
                    @click="confirmOutboundBatch">
                    确认批次完成
                  </el-button>
                  <el-button
                    v-if="attachmentEditable && currentOutboundBatch && currentOutboundBatchEditable"
                    size="mini"
                    type="danger"
                    plain
                    :loading="outboundBatchLoading"
                    @click="voidOutboundBatch">
                    删除当前批次
                  </el-button>
                  <span v-if="openOutboundBatchList.length > 1" class="sub-title-tip">请先点选要处理的批次，再上传回单、水单或确认完成。</span>
                  <span v-if="attachmentEditable && currentOutboundBatch && currentOutboundBatchEditable" class="sub-title-tip">{{ bankVoucherSupportTip }}</span>
                </div>
              </div>
            </div>
            <div v-if="openOutboundBatchList.length" class="outbound-open-batch-list">
              <div
                v-for="batch in openOutboundBatchList"
                :key="batch.id"
                :class="['outbound-open-batch-card', String(activeOutboundBatchId) === String(batch.id) ? 'is-active' : '']"
                @click="selectOutboundBatch(batch)">
                <div class="open-batch-title">
                  <strong>{{ batch.batchNo || '-' }}</strong>
                  <el-tag size="mini" :type="outboundBatchTagType(batch)">{{ formatOutboundBatchStatus(batch.status) }}</el-tag>
                </div>
                <div class="open-batch-meta">
                  <span>{{ batch.ownershipName || '-' }}</span>
                  <span>出库：{{ formatDateOnly(batch.outboundDate) || '-' }}</span>
                  <span>{{ batch.driverName || '-' }}</span>
                  <span>{{ formatInteger(batch.shippedTotalBoxes) }}箱 / {{ formatNumber(batch.shippedTotalWeight, 3) }}KG</span>
                </div>
              </div>
            </div>
            <div v-if="currentOutboundBatch" class="outbound-batch-info">
              <span><strong>货权：</strong>{{ currentOutboundBatch.ownershipName || '-' }}</span>
              <span><strong>出库时间：</strong>{{ formatDateOnly(currentOutboundBatch.outboundDate) || '-' }}</span>
              <span><strong>司机：</strong>{{ currentOutboundBatch.driverName || '-' }}</span>
              <span><strong>车牌号：</strong>{{ currentOutboundBatch.plateNo || '-' }}</span>
              <span><strong>手机号：</strong>{{ currentOutboundBatch.driverMobile || '-' }}</span>
              <span><strong>备注：</strong>{{ currentOutboundBatch.remark || '-' }}</span>
              <el-button size="mini" type="primary" plain @click="downloadPickupDetail(currentOutboundBatch)">下载提货明细</el-button>
            </div>
            <div v-if="currentOutboundBatch && currentOutboundBatch.planItemList && currentOutboundBatch.planItemList.length" class="outbound-section-title">
              <strong>本批次计划及实际核对</strong>
              <span class="sub-title-tip">应出数据取本批次保存的计划；实际数据取已保存的出库回单。</span>
            </div>
            <el-table
              v-if="currentOutboundBatch && currentOutboundBatch.planItemList && currentOutboundBatch.planItemList.length"
              :data="currentOutboundBatch.planItemList"
              border
              size="mini"
              class="attachment-table outbound-plan-table">
              <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
              <el-table-column prop="productCode" label="产品编码" width="105"></el-table-column>
              <el-table-column label="品名" min-width="160" show-overflow-tooltip>
                <template slot-scope="scope">{{ saleProductDisplayName(scope.row) }}</template>
              </el-table-column>
              <el-table-column prop="containerNo" label="柜号" width="130" show-overflow-tooltip></el-table-column>
              <el-table-column prop="factoryNo" label="厂号" width="90" show-overflow-tooltip></el-table-column>
              <el-table-column label="计划箱数" width="90" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.plannedBoxes) }}</template>
              </el-table-column>
              <el-table-column label="实际箱数" width="90" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.actualBoxes) }}</template>
              </el-table-column>
              <el-table-column label="差异箱数" width="90" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.diffBoxes) }}</template>
              </el-table-column>
              <el-table-column label="计划重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.plannedWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="实际重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.actualWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="差异重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.diffWeight, 3) }}</template>
              </el-table-column>
            </el-table>
            <div class="attachment-toolbar">
              <el-tag v-if="dataForm.outboundSummaryList && dataForm.outboundSummaryList.length" size="small" :type="outboundReceiptMatched ? 'success' : 'danger'">
                {{ outboundReceiptMatched ? '整单箱数一致' : '整单待核对' }}
              </el-tag>
              <el-tag v-if="currentOutboundScanList.length" size="small" type="success">
                已绑定扫码链接：{{ currentOutboundScanList.length }}条 / {{ formatInteger(currentOutboundScanTotalBoxes) }}箱 / {{ formatNumber(currentOutboundScanTotalWeight, 3) }}KG
              </el-tag>
              <span v-if="dataForm.outboundSummaryList && dataForm.outboundSummaryList.length" class="sub-title-tip">{{ outboundReceiptMatchMessage }}</span>
            </div>
            <el-table
              v-if="currentOutboundScanList.length"
              :data="currentOutboundScanList"
              border
              size="mini"
              class="attachment-table outbound-scan-table">
              <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
              <el-table-column prop="orderNum" label="顺势云订单号" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="customerName" label="客户名称" min-width="140" show-overflow-tooltip></el-table-column>
              <el-table-column label="扫码箱数" width="90" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.totalBoxes) }}</template>
              </el-table-column>
              <el-table-column label="扫码重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.totalWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="明细行数" width="90" align="right">
                <template slot-scope="scope">{{ (scope.row.itemList || []).length }}</template>
              </el-table-column>
              <el-table-column prop="scanUrl" label="链接" min-width="220" show-overflow-tooltip></el-table-column>
              <el-table-column v-if="attachmentEditable && currentOutboundBatchEditable" label="操作" width="80" fixed="right" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="mini" @click="deleteOutboundScanLink(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="currentOutboundBankSlipVisible" class="bank-slip-panel">
              <div class="outbound-section-title">
                <strong>{{ outboundBankSlipPanelTitle }}</strong>
                <span class="sub-title-tip">{{ outboundBankSlipPanelTip }}</span>
              </div>
              <el-row :gutter="16">
                <el-col :span="24">
                  <div class="bank-slip-card">
                    <div class="bank-slip-card-title">确认结果</div>
                    <el-form-item label="付款人">
                      <el-input v-model="currentOutboundBatch.bankPayerNameModified" :disabled="!currentOutboundBatchEditable"></el-input>
                    </el-form-item>
                    <el-form-item label="收款人">
                      <el-input v-model="currentOutboundBatch.bankPayeeNameModified" :disabled="!currentOutboundBatchEditable"></el-input>
                    </el-form-item>
                    <el-row :gutter="10">
                      <el-col :span="12">
                        <el-form-item label="金额">
                          <el-input v-model="currentOutboundBatch.bankAmountModified" :disabled="!currentOutboundBatchEditable" placeholder="可粘贴155,794.12"></el-input>
                        </el-form-item>
                      </el-col>
                      <el-col :span="12">
                        <el-form-item label="付款日期">
                          <el-date-picker
                            v-model="currentOutboundBatch.bankPaymentDateModified"
                            type="date"
                            value-format="yyyy-MM-dd HH:mm:ss"
                            :disabled="!currentOutboundBatchEditable"
                            placeholder="选择付款日期"
                            style="width: 100%;">
                          </el-date-picker>
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-form-item label="流水号">
                      <el-input v-model="currentOutboundBatch.bankSerialNoModified" :disabled="!currentOutboundBatchEditable"></el-input>
                    </el-form-item>
                    <div class="bank-slip-diff">
                      <span>本批次应收金额：¥{{ formatNumber(currentOutboundBatch.bankExpectedAmount, 2) }}</span>
                      <span>确认金额差异：¥{{ formatNumber(currentOutboundBatch.bankAmountDiff, 2) }}</span>
                    </div>
                    <div v-if="currentOutboundBankSlipDiffVisible" class="bank-slip-diff-warning">
                      确认金额与本批次应收金额存在差异，请核对；该差异会保存，但不会阻止确认批次完成。
                    </div>
                    <el-button
                      v-if="attachmentEditable && currentOutboundBatchEditable"
                      size="mini"
                      type="primary"
                      plain
                      :loading="bankSlipSaving"
                      @click="saveOutboundBatchBankSlip">
                      保存水单确认结果
                    </el-button>
                  </div>
                </el-col>
              </el-row>
            </div>
            <div v-if="currentOutboundBatch" class="secondary-fee-panel">
              <div class="outbound-section-title">
                <strong>二批超期费用</strong>
                <span class="sub-title-tip">利息按二批商阶梯年化分段计算，库费按仓库二批收费标准计算。</span>
              </div>
              <div class="secondary-fee-cards">
                <div class="secondary-fee-card">
                  <span>计息天数</span>
                  <strong>{{ formatInteger(currentOutboundBatch.secondaryInterestDays) }}天</strong>
                </div>
                <div class="secondary-fee-card">
                  <span>二批利息</span>
                  <strong>¥{{ formatNumber(currentOutboundBatch.secondaryInterestAmount, 2) }}</strong>
                </div>
                <div class="secondary-fee-card">
                  <span>库费天数</span>
                  <strong>{{ formatInteger(currentOutboundBatch.secondaryStorageDays) }}天</strong>
                </div>
                <div class="secondary-fee-card">
                  <span>二批库费</span>
                  <strong>¥{{ formatNumber(currentOutboundBatch.secondaryStorageAmount, 2) }}</strong>
                </div>
                <div class="secondary-fee-card total">
                  <span>费用合计</span>
                  <strong>
                    ¥{{ formatNumber(currentOutboundBatch.secondaryFeeAmount, 2) }}
                    <el-popover
                      v-if="currentOutboundBatch.secondaryFeeRemark"
                      placement="top"
                      trigger="hover"
                      width="460">
                      <div class="secondary-fee-popover">{{ currentOutboundBatch.secondaryFeeRemark }}</div>
                      <i slot="reference" class="el-icon-question secondary-fee-help"></i>
                    </el-popover>
                  </strong>
                </div>
              </div>
            </div>
            <div v-if="currentOutboundBatch && currentOutboundBatch.expenseList && currentOutboundBatch.expenseList.length" class="outbound-section-title">
              <strong>本批次支出费用</strong>
              <span class="sub-title-tip">批次确认完成后自动生成冷库费。</span>
            </div>
            <el-table
              v-if="currentOutboundBatch && currentOutboundBatch.expenseList && currentOutboundBatch.expenseList.length"
              :data="currentOutboundBatch.expenseList"
              border
              size="mini"
              class="attachment-table outbound-expense-table">
              <el-table-column prop="expenseName" label="费用名称" width="120"></el-table-column>
              <el-table-column prop="warehouseName" label="仓库" min-width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="temperatureZone" label="温区" width="80" align="center"></el-table-column>
              <el-table-column label="计费期间" min-width="180">
                <template slot-scope="scope">{{ formatDateOnly(scope.row.businessStartDate) }} 至 {{ formatDateOnly(scope.row.businessEndDate) }}</template>
              </el-table-column>
              <el-table-column prop="freeDays" label="免费天数" width="90" align="right"></el-table-column>
              <el-table-column prop="chargeDays" label="计费天数" width="90" align="right"></el-table-column>
              <el-table-column label="重量(吨)" width="100" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.weightTon, 3) }}</template>
              </el-table-column>
              <el-table-column label="费率" width="90" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.rate, 2) }}</template>
              </el-table-column>
              <el-table-column label="金额" width="110" align="right">
                <template slot-scope="scope">¥{{ formatNumber(scope.row.totalAmount, 2) }}</template>
              </el-table-column>
            </el-table>
            <el-row v-if="dataForm.outboundReceipt" :gutter="20">
              <el-col :span="6">
                <el-form-item label="销售单箱数">
                  <el-input :value="dataForm.outboundReceipt.saleTotalBoxes || 0" disabled></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="发货总箱数">
                  <el-input :value="outboundShippedTotalBoxes" disabled></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12" class="outbound-receipt-actions">
                <el-button
                  v-if="outboundReceiptEditable"
                  size="mini"
                  type="primary"
                  plain
                  @click="addOutboundReceiptItemRow">
                  新增明细
                </el-button>
              </el-col>
            </el-row>
            <div v-if="dataForm.outboundSummaryList && dataForm.outboundSummaryList.length" class="outbound-adjustment-summary">
              <span>整单多退少补汇总：</span>
              <strong v-if="outboundAdjustmentReady" :class="outboundAdjustmentTotal >= 0 ? 'refund' : 'supplement'">
                {{ outboundAdjustmentTotal >= 0 ? '应退款' : '应补款' }} ¥{{ Math.abs(outboundAdjustmentTotal).toFixed(2) }}
              </strong>
              <strong v-else class="pending-adjustment">待整单出库完成后计算</strong>
              <span class="summary-tip">按所有有效出库批次汇总，整单箱数匹配完成后再计算金额，避免部分出库阶段误判。</span>
            </div>
            <el-table
              v-if="dataForm.outboundSummaryList && dataForm.outboundSummaryList.length"
              :key="`outbound-summary-${outboundTableVersion}`"
              ref="outboundSummaryTable"
              row-key="productId"
              :data="dataForm.outboundSummaryList"
              border
              size="mini"
              class="attachment-table outbound-summary-table">
              <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
              <el-table-column prop="productCode" label="系统编码" width="110"></el-table-column>
              <el-table-column label="品名" min-width="170" show-overflow-tooltip>
                <template slot-scope="scope">{{ saleProductDisplayName(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="应出箱数" width="95" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.expectedBoxes) }}</template>
              </el-table-column>
              <el-table-column label="实际箱数" width="95" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.shippedQty) }}</template>
              </el-table-column>
              <el-table-column label="差异箱数" width="95" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.diffBoxes) }}</template>
              </el-table-column>
              <el-table-column label="应出重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.expectedWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="实际重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.totalWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="差异重量(KG)" width="120" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.diffWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="单价" width="95" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.salePriceKg, 2) }}</template>
              </el-table-column>
              <el-table-column label="应退/应补" width="115" align="right">
                <template slot-scope="scope">
                  <span v-if="outboundAdjustmentReady" :class="Number(scope.row.adjustmentAmount || 0) >= 0 ? 'refund' : 'supplement'">
                    {{ formatNumber(scope.row.adjustmentAmount, 2) }}
                  </span>
                  <span v-else class="pending-adjustment">待整单完成</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="outbound-section-title outbound-history-section-title">
              <strong>历史确认批次明细</strong>
              <span class="sub-title-tip">只展示已确认完成批次，便于核对历史出库。</span>
            </div>
            <el-table
              :key="`outbound-history-${outboundTableVersion}`"
              ref="outboundHistoryTable"
              row-key="id"
              :data="confirmedOutboundBatchList"
              border
              size="mini"
              class="attachment-table outbound-history-table">
              <el-table-column type="expand">
                <template slot-scope="scope">
                  <div class="history-detail-label">批次计划</div>
                  <el-table :data="scope.row.planItemList" border size="mini" class="attachment-table outbound-history-detail-table">
                    <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
                    <el-table-column prop="productCode" label="产品编码" width="105"></el-table-column>
                    <el-table-column label="品名" min-width="160" show-overflow-tooltip>
                      <template slot-scope="itemScope">{{ saleProductDisplayName(itemScope.row) }}</template>
                    </el-table-column>
                    <el-table-column prop="containerNo" label="柜号" width="130" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="factoryNo" label="厂号" width="90" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="plannedBoxes" label="计划箱数" width="90" align="right"></el-table-column>
                    <el-table-column label="计划重量(KG)" width="120" align="right">
                      <template slot-scope="itemScope">{{ formatNumber(itemScope.row.plannedWeight, 3) }}</template>
                    </el-table-column>
                  </el-table>
                  <div class="history-detail-label">实际出库</div>
                  <el-table :data="scope.row.receiptItemList" border size="mini" class="attachment-table outbound-history-detail-table">
                    <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
                    <el-table-column prop="productCode" label="系统编码" width="110"></el-table-column>
                    <el-table-column label="品名" min-width="170" show-overflow-tooltip>
                      <template slot-scope="itemScope">{{ saleProductDisplayName(itemScope.row) }}</template>
                    </el-table-column>
                    <el-table-column prop="containerNo" label="柜号" width="130" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="factoryNo" label="厂号" width="100" show-overflow-tooltip></el-table-column>
                    <el-table-column label="实际箱数" width="100" align="right">
                      <template slot-scope="itemScope">{{ formatInteger(itemScope.row.shippedQty) }}</template>
                    </el-table-column>
                    <el-table-column label="实际重量(KG)" width="125" align="right">
                      <template slot-scope="itemScope">{{ formatNumber(itemScope.row.totalWeight, 3) }}</template>
                    </el-table-column>
                    <el-table-column label="单价" width="95" align="right">
                      <template slot-scope="itemScope">{{ formatNumber(itemScope.row.salePriceKg, 2) }}</template>
                    </el-table-column>
                    <el-table-column prop="wmsOrderNo" label="WMS单号" width="130" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="outboundOrderNo" label="订单编号" width="150" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="customerCode" label="客户编码" width="110" show-overflow-tooltip></el-table-column>
                    <el-table-column prop="customerName" label="客户名称" width="140" show-overflow-tooltip></el-table-column>
                  </el-table>
                </template>
              </el-table-column>
              <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
              <el-table-column prop="batchNo" label="批次号" width="110"></el-table-column>
              <el-table-column label="出库时间" width="110" align="center">
                <template slot-scope="scope">{{ formatDateOnly(scope.row.outboundDate) }}</template>
              </el-table-column>
              <el-table-column prop="ownershipName" label="货权" min-width="130" show-overflow-tooltip></el-table-column>
              <el-table-column prop="driverName" label="司机" width="100" show-overflow-tooltip></el-table-column>
              <el-table-column prop="plateNo" label="车牌号" width="110" show-overflow-tooltip></el-table-column>
              <el-table-column label="明细行数" width="90" align="right">
                <template slot-scope="scope">{{ scope.row.receiptItemList.length }}</template>
              </el-table-column>
              <el-table-column label="实际箱数" width="100" align="right">
                <template slot-scope="scope">{{ formatInteger(scope.row.shippedTotalBoxes) }}</template>
              </el-table-column>
              <el-table-column label="实际重量(KG)" width="125" align="right">
                <template slot-scope="scope">{{ formatNumber(scope.row.shippedTotalWeight, 3) }}</template>
              </el-table-column>
              <el-table-column label="出库冷库费" width="120" align="right">
                <template slot-scope="scope">¥{{ formatBatchExpenseAmount(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="二批费用" width="145" align="right">
                <template slot="header" slot-scope="scope">
                  <span>二批费用</span>
                  <el-tooltip
                    effect="dark"
                    placement="top"
                    content="二批费用=二批利息+二批库费；每行问号可查看公式和本批次代入数据，不是水单金额。">
                    <i class="el-icon-question secondary-fee-help"></i>
                  </el-tooltip>
                </template>
                <template slot-scope="scope">
                  <span class="secondary-fee-cell">
                    <span>¥{{ formatNumber(scope.row.secondaryFeeAmount, 2) }}</span>
                    <el-popover
                      v-if="scope.row.secondaryFeeRemark"
                      placement="top"
                      trigger="hover"
                      width="460">
                      <div class="secondary-fee-popover">{{ scope.row.secondaryFeeRemark }}</div>
                      <i slot="reference" class="el-icon-question secondary-fee-help"></i>
                    </el-popover>
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="归档原件" min-width="180">
                <template slot-scope="scope">
                  <el-button
                    v-for="file in scope.row.receiptFileList"
                    :key="file.id"
                    type="text"
                    size="small"
                    @click="previewFile(file)">
                    预览{{ file.lineNo || '' }}
                  </el-button>
                  <el-button
                    v-for="file in scope.row.receiptFileList"
                    :key="`download-${file.id}`"
                    type="text"
                    size="small"
                    @click="downloadFile(file)">
                    下载{{ file.lineNo || '' }}
                  </el-button>
                  <span v-if="!scope.row.receiptFileList.length" class="sub-title-tip">无</span>
                </template>
              </el-table-column>
              <el-table-column label="水单" min-width="130">
                <template slot-scope="scope">
                  <el-button v-if="scope.row.bankSlipFile" type="text" size="small" @click="openBankSlipDetail(scope.row)">查看水单</el-button>
                  <el-button v-if="scope.row.bankSlipFile" type="text" size="small" @click="previewFile(scope.row.bankSlipFile)">预览水单</el-button>
                  <el-button v-if="scope.row.bankSlipFile" type="text" size="small" @click="downloadFile(scope.row.bankSlipFile)">下载水单</el-button>
                  <span v-else class="sub-title-tip">无</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="135" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="downloadPickupDetail(scope.row)">提货明细</el-button>
                  <el-button v-if="attachmentEditable" type="text" size="small" @click="deleteOutboundBatch(scope.row)">删除批次</el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="outbound-section-title outbound-current-section-title">
              <strong>当前批次明细</strong>
              <span class="sub-title-tip">当前正在上传、核对和保存的出库批次。</span>
            </div>
            <el-table
              v-if="dataForm.outboundReceipt"
              :key="`outbound-receipt-${outboundTableVersion}-${currentOutboundBatch ? currentOutboundBatch.id : 'none'}`"
              ref="outboundReceiptTable"
              row-key="id"
              :data="dataForm.outboundReceipt.itemList"
              border
              size="mini"
              class="attachment-table outbound-receipt-table">
              <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
              <el-table-column prop="contractNo" label="合同号" width="150" show-overflow-tooltip></el-table-column>
              <el-table-column prop="recognizedProductCode" label="识别编码" width="100"></el-table-column>
              <el-table-column prop="planMatchStatus" label="计划匹配" width="100">
                <template slot-scope="scope">
                  <el-tag size="mini" :type="scope.row.planMatchStatus === '已匹配' ? 'success' : 'danger'">
                    {{ scope.row.planMatchStatus || '待匹配' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="系统编码" min-width="220">
                <template slot-scope="scope">
                  <el-select
                    v-model="scope.row.productId"
                    filterable
                    clearable
                    remote
                    reserve-keyword
                    size="mini"
                    :disabled="!outboundReceiptEditable"
                    :loading="scope.row._productLoading"
                    placeholder="输入产品编码/中文/英文搜索"
                    style="width: 100%;"
                    @visible-change="visible => outboundReceiptProductVisibleChange(scope.row, visible)"
                    :remote-method="keyword => remoteSearchOutboundReceiptProducts(scope.row, keyword)"
                    @change="value => outboundReceiptProductChange(scope.row, value)">
                    <el-option
                      v-for="item in scope.row._productOptions"
                      :key="item.id"
                      :label="item.productCode"
                      :value="item.id">
                      <div class="product-option-code">{{ item.productCode }}</div>
                      <div class="product-option-name">{{ item.marketCirculationName || item.productName || '-' }} / {{ item.productNameEn || '-' }}</div>
                    </el-option>
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="品名" min-width="170" show-overflow-tooltip>
                <template slot-scope="scope">{{ saleProductDisplayName(scope.row) }}</template>
              </el-table-column>
              <el-table-column label="规格" width="90">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.productSpec" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="单位" width="80">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.unit" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="柜号" width="130">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.containerNo" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="厂号" width="100">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.factoryNo" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="应出箱数" width="95" align="right">
                <template slot-scope="scope">
                  {{ formatInteger(scope.row.expectedBoxes) }}
                </template>
              </el-table-column>
              <el-table-column label="实际箱数" width="100">
                <template slot-scope="scope">
                  <el-input-number v-model="scope.row.shippedQty" :disabled="!outboundReceiptEditable" :controls="false" :precision="0" size="mini" style="width: 100%;"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="差异箱数" width="95" align="right">
                <template slot-scope="scope">
                  {{ formatInteger(calcOutboundDiffBoxes(scope.row)) }}
                </template>
              </el-table-column>
              <el-table-column label="应出重量(KG)" width="120" align="right">
                <template slot-scope="scope">
                  {{ formatNumber(scope.row.expectedWeight, 3) }}
                </template>
              </el-table-column>
              <el-table-column label="实际重量(KG)" width="125">
                <template slot-scope="scope">
                  <el-input-number v-model="scope.row.totalWeight" :disabled="!outboundReceiptEditable" :controls="false" :precision="3" size="mini" style="width: 100%;"></el-input-number>
                </template>
              </el-table-column>
              <el-table-column label="差异重量(KG)" width="120" align="right">
                <template slot-scope="scope">
                  {{ formatNumber(calcOutboundDiffWeight(scope.row), 3) }}
                </template>
              </el-table-column>
              <el-table-column label="单价" width="95" align="right">
                <template slot-scope="scope">
                  {{ formatNumber(scope.row.salePriceKg, 2) }}
                </template>
              </el-table-column>
              <el-table-column label="应退/应补" width="115" align="right">
                <template slot-scope="scope">
                  <span v-if="outboundAdjustmentReady" :class="calcOutboundAdjustmentAmount(scope.row) >= 0 ? 'refund' : 'supplement'">
                    {{ formatNumber(calcOutboundAdjustmentAmount(scope.row), 2) }}
                  </span>
                  <span v-else class="pending-adjustment">待整单完成</span>
                </template>
              </el-table-column>
              <el-table-column label="WMS单号" width="130">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.wmsOrderNo" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="订单编号" width="150">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.outboundOrderNo" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="客户编码" width="110">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.customerCode" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="客户名称" width="140">
                <template slot-scope="scope">
                  <el-input v-model="scope.row.customerName" :disabled="!outboundReceiptEditable" size="mini"></el-input>
                </template>
              </el-table-column>
              <el-table-column v-if="outboundReceiptEditable" label="操作" width="80" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="removeOutboundReceiptItemRow(scope.$index)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-table :data="currentOutboundReceiptFiles" border size="mini" class="attachment-table outbound-receipt-files-table">
              <el-table-column prop="fileName" label="归档原件" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('OUTBOUND_RECEIPT')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-table :data="currentOutboundBankSlipFiles" border size="mini" class="attachment-table outbound-bank-files-table">
              <el-table-column prop="fileName" label="二批来款水单" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && currentOutboundBatchEditable" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="出库附件" name="outboundAttachment">
            <div class="attachment-toolbar">
              <el-button
                v-if="attachmentEditable && canUploadStep('OUTBOUND_ATTACHMENT')"
                size="mini"
                type="primary"
                plain
                @click="triggerUpload('OUTBOUND_ATTACHMENT')">
                上传出库附件
              </el-button>
              <span class="sub-title-tip">用于存档司机驾驶证、身份证等出库相关附件，不做OCR识别。</span>
            </div>
            <el-table :data="getFileListByType('OUTBOUND_ATTACHMENT')" border size="mini" class="attachment-table">
              <el-table-column prop="fileName" label="文件名称" min-width="240" show-overflow-tooltip></el-table-column>
              <el-table-column label="上传时间" width="170" align="center">
                <template slot-scope="scope">{{ formatDateTime(scope.row.createTime) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template slot-scope="scope">
                  <el-button type="text" size="small" @click="previewFile(scope.row)">预览</el-button>
                  <el-button type="text" size="small" @click="downloadFile(scope.row)">下载</el-button>
                </template>
              </el-table-column>
              <el-table-column label="删除" width="100" align="center">
                <template slot-scope="scope">
                  <el-button v-if="attachmentEditable && canDeleteStep('OUTBOUND_ATTACHMENT')" type="text" size="small" @click="deleteFile(scope.row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>

        <input ref="uploadInput" type="file" multiple style="display:none;" @change="uploadFileChangeHandle">
      </el-form>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-if="!contentReadonly"
        type="primary"
        :loading="saveLoading"
        @click="dataFormSubmit()">
        保存
      </el-button>
    </span>
    <el-dialog
      :title="spotPricingMode === 'EDIT' ? '调整销售价和预计重量' : '录入销售价和预计重量'"
      :visible.sync="spotPricingDialogVisible"
      width="960px"
      append-to-body
      custom-class="spot-pricing-dialog">
      <div class="spot-pricing-overview">
        <div><span>产品编码</span><strong>{{ spotPricingForm.productCode || '-' }}</strong></div>
        <div><span>市场流通名称</span><strong>{{ spotPricingForm.marketCirculationName || spotPricingForm.productName || '-' }}</strong></div>
        <div><span>本次箱数</span><strong>{{ spotPricingForm.selectedBoxes || 0 }} 箱</strong></div>
      </div>
      <div class="spot-pricing-table-title">本次库存批次</div>
      <el-table :data="spotPricingDetailRows" border size="mini" max-height="300" class="spot-pricing-detail-table">
        <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
        <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="140" show-overflow-tooltip></el-table-column>
        <el-table-column prop="warehouseName" label="仓库" min-width="125" show-overflow-tooltip></el-table-column>
        <el-table-column prop="sourceContainerNo" label="柜号" min-width="115" show-overflow-tooltip></el-table-column>
        <el-table-column label="生产日期" width="105">
          <template slot-scope="scope">{{ formatDateOnly(scope.row.productionDate) }}</template>
        </el-table-column>
        <el-table-column label="过期日期" width="105">
          <template slot-scope="scope">{{ formatDateOnly(scope.row.expiryDate) }}</template>
        </el-table-column>
        <el-table-column prop="availableBoxes" label="可售箱数" width="85" align="right"></el-table-column>
        <el-table-column label="本次销售箱数" width="125">
          <template slot-scope="scope">
            <el-input-number
              v-model="scope.row.boxes"
              :controls="false"
              :min="1"
              :max="scope.row.availableBoxes || 999999"
              :precision="0"
              size="mini"
              style="width: 100%;"
              @change="spotPricingBoxesChange">
            </el-input-number>
          </template>
        </el-table-column>
      </el-table>
      <el-form label-width="145px" size="small">
        <el-form-item required label="销售价（元/千克）">
          <el-input-number
            v-model="spotPricingForm.salePriceKg"
            :controls="false"
            :min="0.01"
            :precision="2"
            placeholder="请输入销售价"
            style="width: 100%;">
          </el-input-number>
        </el-form-item>
        <el-form-item required label="预计重量（KG）">
          <el-input-number
            v-model="spotPricingForm.expectedWeightKg"
            :controls="false"
            :min="0.01"
            :precision="2"
            placeholder="请输入预计重量"
            style="width: 100%;">
          </el-input-number>
          <div class="spot-pricing-tip">系统已按当前库存单箱重量自动计算，可根据实际销售情况修改。</div>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="spotPricingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSpotPricing">确认</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="By产品销售汇总"
      :visible.sync="spotSummaryDialogVisible"
      width="880px"
      append-to-body>
      <el-table :data="dataForm.itemList || []" border size="mini" max-height="440">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="productCode" label="产品编码" width="120"></el-table-column>
        <el-table-column label="市场流通名称" min-width="190" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.marketCirculationName || scope.row.productName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="boxes" label="总箱数" width="100" align="right"></el-table-column>
        <el-table-column label="总重量KG" width="130" align="right">
          <template slot-scope="scope">{{ formatNumber(scope.row.contractQuantityKg, 2) }}</template>
        </el-table-column>
        <el-table-column label="销售价（元/千克）" width="155" align="right">
          <template slot-scope="scope">{{ formatNumber(scope.row.salePriceKg, 2) }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="spotSummaryDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="二批来款水单详情"
      :visible.sync="bankSlipDetailVisible"
      width="760px"
      append-to-body
      custom-class="bank-slip-detail-dialog">
      <div v-if="bankSlipDetailBatch" class="bank-slip-detail">
        <div class="bank-slip-detail-header">
          <span>批次号：{{ bankSlipDetailBatch.batchNo || '-' }}</span>
          <span>模板：{{ bankSlipDetailBatch.bankVoucherTemplate || '-' }}</span>
        </div>
        <el-row :gutter="16">
          <el-col :span="24">
            <div class="bank-slip-card">
              <div class="bank-slip-card-title">确认结果</div>
              <el-form label-width="82px" size="mini">
                <el-form-item label="付款人">
                  <el-input :value="bankSlipDetailBatch.bankPayerNameModified || ''" disabled></el-input>
                </el-form-item>
                <el-form-item label="收款人">
                  <el-input :value="bankSlipDetailBatch.bankPayeeNameModified || ''" disabled></el-input>
                </el-form-item>
                <el-form-item label="金额">
                  <el-input :value="formatNumber(bankSlipDetailBatch.bankAmountModified, 2)" disabled></el-input>
                </el-form-item>
                <el-form-item label="付款日期">
                  <el-input :value="formatDateOnly(bankSlipDetailBatch.bankPaymentDateModified)" disabled></el-input>
                </el-form-item>
                <el-form-item label="流水号">
                  <el-input :value="bankSlipDetailBatch.bankSerialNoModified || ''" disabled></el-input>
                </el-form-item>
              </el-form>
            </div>
          </el-col>
        </el-row>
        <div class="bank-slip-detail-summary">
          <span>本批次应收金额：¥{{ formatNumber(bankSlipDetailBatch.bankExpectedAmount, 2) }}</span>
          <span>确认金额差异：¥{{ formatNumber(bankSlipDetailBatch.bankAmountDiff, 2) }}</span>
        </div>
        <div v-if="bankSlipDetailDiffVisible" class="bank-slip-diff-warning">
          确认金额与本批次应收金额存在差异，请核对；该差异已保存，不影响批次完成状态。
        </div>
        <div class="bank-slip-detail-actions">
          <el-button v-if="bankSlipDetailBatch.bankSlipFile" size="mini" type="primary" plain @click="previewFile(bankSlipDetailBatch.bankSlipFile)">
            预览水单原件
          </el-button>
          <el-button v-if="bankSlipDetailBatch.bankSlipFile" size="mini" type="primary" plain @click="downloadFile(bankSlipDetailBatch.bankSlipFile)">
            下载水单原件
          </el-button>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="bankSlipDetailVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    <el-dialog
      title="客户全款付款详情"
      :visible.sync="fullPaymentDialogVisible"
      width="780px"
      append-to-body
      custom-class="bank-slip-detail-dialog">
      <div class="bank-slip-detail">
        <div class="bank-slip-detail-header">
          <span>销售单号：{{ dataForm.orderNo || '-' }}</span>
          <span>销售单金额：¥{{ formatNumber(dataForm.fullPaymentExpectedAmount, 2) }}</span>
        </div>
        <el-alert
          v-if="!fullPaymentUploaded"
          title="全款付款模式允许先保存销售单，但上传客户全款水单前不能新增出库批次，也不能进行客户一次性付款还款。"
          type="warning"
          :closable="false"
          show-icon>
        </el-alert>
        <div class="bank-slip-card full-payment-card">
          <div class="bank-slip-card-title">确认结果</div>
          <el-form label-width="90px" size="mini">
            <el-form-item label="付款人">
              <el-input v-model="dataForm.fullPaymentPayerNameModified" :disabled="readonly"></el-input>
            </el-form-item>
            <el-form-item label="收款人">
              <el-input v-model="dataForm.fullPaymentPayeeNameModified" :disabled="readonly"></el-input>
            </el-form-item>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="金额">
                  <el-input v-model="dataForm.fullPaymentAmountModified" :disabled="readonly" placeholder="可粘贴155,794.12"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="付款日期">
                  <el-date-picker
                    v-model="dataForm.fullPaymentDateModified"
                    type="date"
                    value-format="yyyy-MM-dd"
                    :disabled="readonly"
                    placeholder="选择付款日期"
                    style="width: 100%;">
                  </el-date-picker>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="流水号">
              <el-input v-model="dataForm.fullPaymentSerialNoModified" :disabled="readonly"></el-input>
            </el-form-item>
          </el-form>
          <div class="bank-slip-diff">
            <span>销售单应收金额：¥{{ formatNumber(dataForm.fullPaymentExpectedAmount, 2) }}</span>
            <span>确认金额差异：¥{{ formatNumber(dataForm.fullPaymentAmountDiff, 2) }}</span>
          </div>
          <div v-if="fullPaymentAmountDiffVisible" class="bank-slip-diff-warning">
            确认金额与销售单应收金额存在差异，请核对；该差异会保存，但不影响后续流程。
          </div>
        </div>
        <div class="bank-slip-detail-actions">
          <el-button
            v-if="!readonly"
            size="mini"
            type="primary"
            plain
            :loading="uploadLoading && currentUploadType === 'FULL_PAYMENT_VOUCHER'"
            @click="triggerFullPaymentUpload">
            {{ fullPaymentUploaded ? '重新识别全款水单' : '上传全款水单识别' }}
          </el-button>
          <el-button
            v-if="!readonly && fullPaymentUploaded"
            size="mini"
            type="primary"
            plain
            :loading="fullPaymentSaving"
            @click="saveFullPaymentVoucher">
            保存确认结果
          </el-button>
          <el-button v-if="dataForm.fullPaymentFile" size="mini" type="primary" plain @click="previewFile(dataForm.fullPaymentFile)">
            预览水单原件
          </el-button>
          <el-button v-if="dataForm.fullPaymentFile" size="mini" type="primary" plain @click="downloadFile(dataForm.fullPaymentFile)">
            下载水单原件
          </el-button>
        </div>
        <input ref="fullPaymentUploadInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none;" @change="fullPaymentUploadChangeHandle">
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="fullPaymentDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
    <sale-outbound-batch-dialog
      v-if="outboundBatchDialogVisible"
      ref="outboundBatchDialog"
      @created="outboundBatchCreated">
    </sale-outbound-batch-dialog>
  </el-dialog>
</template>

<script>
import SaleOutboundBatchDialog from './sale-outbound-batch-dialog'

export default {
  components: {
    SaleOutboundBatchDialog
  },
  data () {
    return {
      visible: false,
      readonly: false,
      detailLoading: false,
      previewLoading: false,
      saveLoading: false,
      uploadLoading: false,
      confirmLoading: false,
      outboundSaveLoading: false,
      outboundBatchLoading: false,
      outboundBatchDialogVisible: false,
      bankSlipSaving: false,
      bankSlipDetailVisible: false,
      bankSlipDetailBatch: null,
      fullPaymentDialogVisible: false,
      fullPaymentSaving: false,
      globalLoadingCount: 0,
      currentUploadType: '',
      currentConfirmType: '',
      bankVoucherSupportTip: '支持浦发银行、建设银行、工商银行、兴业银行、中国银行、农发行电子回单样本，支持 PDF / JPG / PNG。',
      activeOutboundBatchId: '',
      outboundTableVersion: 0,
      internalEntityList: [],
      secondaryPartnerList: [],
      warehouseList: [],
      productList: [],
      spotProductId: '',
      spotProductLoading: false,
      spotProductOptions: [],
      spotProductRequestSeq: 0,
      spotContractLoading: false,
      spotContractList: [],
      spotContractRequestSeq: 0,
      spotContractTableVersion: 0,
      spotAllocationTableVersion: 0,
      spotPricingDialogVisible: false,
      spotPricingMode: 'ADD',
      spotPricingCandidates: [],
      spotPricingRows: [],
      spotPricingDetailRows: [],
      spotPricingForm: {
        productId: '',
        productCode: '',
        productName: '',
        marketCirculationName: '',
        salePriceKg: null,
        expectedWeightKg: null,
        selectedBoxes: 0
      },
      spotSummaryDialogVisible: false,
      presaleOrderOptions: [],
      presaleOrderKeyword: '',
      presaleOrderLoading: false,
      salespersonOptions: [],
      salespersonLoading: false,
      dataForm: this.defaultForm(),
      dataRule: {
        sellingEntityId: [{ required: true, message: '请选择销售主体', trigger: 'change' }],
        saleType: [{ required: true, message: '请选择销售类型', trigger: 'change' }],
        secondaryPartnerId: [{ required: true, message: '请选择二批商', trigger: 'change' }],
        salespersonId: [{ required: true, message: '请选择销售', trigger: 'change' }],
        contractSignDate: [{ required: true, message: '请选择签订日期', trigger: 'change' }]
      }
    }
  },
  computed: {
    dialogTitle () {
      if (this.readonly) return '销售单详情'
      return this.dataForm.id ? '销售单附件处理' : '新增销售单'
    },
    isSpotSale () {
      return this.dataForm.saleType === 'SPOT'
    },
    isFuturesSale () {
      return this.dataForm.saleType === 'FUTURES'
    },
    statusLabel () {
      const map = {
        1: '待确认盖章合同',
        2: '待出库完成',
        3: '待出库完成',
        4: '待出库完成',
        5: '待出库完成',
        6: '流程完成'
      }
      return map[this.dataForm.status] || '待处理'
    },
    contentReadonly () {
      return this.readonly || (!!this.dataForm.id && this.dataForm.riskStatus !== 'REJECTED')
    },
    spotPendingLotCount () {
      return (this.spotContractList || []).reduce((total, contract) => total + ((contract._selectedLots || []).length), 0)
    },
    attachmentEditable () {
      return !this.readonly && !!this.dataForm.id
    },
    isFullPaymentMode () {
      return Number(this.dataForm.paymentMode || 1) === 2
    },
    paymentModeLabel () {
      return this.isFullPaymentMode ? '全款付款' : '分批付款'
    },
    paymentModeLocked () {
      return !!this.dataForm.id && Number(this.dataForm.outboundBatchCount || 0) > 0
    },
    fullPaymentUploaded () {
      return !!(this.dataForm.fullPaymentFileId || this.dataForm.fullPaymentFile)
    },
    fullPaymentAmountDiffVisible () {
      return Math.abs(this.parseAmountValue(this.dataForm.fullPaymentAmountDiff)) >= 0.01
    },
    outboundBankSlipUploadLabel () {
      const base = this.isFullPaymentMode ? '仓储费水单' : '二批来款水单'
      return this.currentOutboundBankSlipVisible ? `重新识别${base}` : `上传${base}`
    },
    outboundBankSlipPanelTitle () {
      return this.isFullPaymentMode ? '仓储费水单确认结果' : '二批来款水单确认结果'
    },
    outboundBankSlipPanelTip () {
      if (this.isFullPaymentMode) {
        return '客户已全款付款，当前批次水单只核对仓储费；金额差异只提示并保存，不拦截批次完成。'
      }
      return '系统已自动带入识别内容，用户只需核对和修改确认结果；金额差异只提示并保存，不拦截批次完成。'
    },
    outboundCompleted () {
      return Number(this.dataForm.outboundReceiptConfirmed || 0) === 1 || this.outboundReceiptMatched
    },
    outboundWorkflowActiveStep () {
      if (this.outboundCompleted) return 4
      if (!this.currentOutboundBatch) return 0
      if (!this.currentOutboundHasReceiptFile) return 1
      if (!this.currentOutboundBankSlipVisible) return 2
      return 3
    },
    outboundWorkflowTip () {
      if (this.outboundCompleted) return '整单箱数已匹配，出库流程已完成。'
      if (this.isFullPaymentMode && !this.fullPaymentUploaded) return '当前为全款付款，请先在“全款付款详情”上传客户全款水单，再新增出库批次。'
      if (!this.currentOutboundBatch) return '先新增一个出库批次，再按步骤上传单据。'
      if (!this.currentOutboundHasReceiptFile) return '当前批次已创建，下一步上传出库回单。'
      if (!this.currentOutboundBankSlipVisible) return this.isFullPaymentMode ? '出库回单已上传，下一步上传仓储费水单。' : '出库回单已上传，下一步上传二批来款水单。'
      if (this.canConfirmOutboundBatch) return '单据已齐全，可以确认当前批次完成。'
      return '请先保存并核对当前批次明细，再确认批次完成。'
    },
    showSpotPreviewButton () {
      return this.isSpotSale && !this.contentReadonly
    },
    showSpotAllocation () {
      return this.isSpotSale && this.dataForm.allocationItemList && this.dataForm.allocationItemList.length > 0
    },
    coldStorageFreeDaysText () {
      const days = this.dataForm.secondaryPartnerColdStorageFreeDays
      return days ? `${days}天` : '-'
    },
    currentOutboundBatch () {
      const list = this.openOutboundBatchList
      if (!list.length) return null
      const active = list.find(item => String(item.id) === String(this.activeOutboundBatchId))
      return active || list[0]
    },
    openOutboundBatchList () {
      const list = this.dataForm.outboundBatchList || []
      return list.filter(item => {
        const status = Number(item.status || 0)
        return status !== 3 && status !== 9
      })
    },
    hasOpenOutboundBatch () {
      return this.openOutboundBatchList.length > 0
    },
    currentOutboundBatchEditable () {
      if (!this.currentOutboundBatch) return false
      const status = Number(this.currentOutboundBatch.status || 0)
      return status !== 3 && status !== 9
    },
    currentOutboundBatchTagType () {
      if (!this.currentOutboundBatch) return 'info'
      return this.outboundBatchTagType(this.currentOutboundBatch)
    },
    currentOutboundReceiptFiles () {
      const batch = this.currentOutboundBatch
      return batch ? (batch.receiptFileList || []) : []
    },
    currentOutboundBankSlipFiles () {
      const batch = this.currentOutboundBatch
      if (!batch || !batch.bankSlipFile) return []
      return [batch.bankSlipFile]
    },
    currentOutboundBankSlipVisible () {
      const batch = this.currentOutboundBatch
      return !!(batch && (batch.bankSlipFileId || batch.bankSlipFile))
    },
    currentOutboundBankSlipDiffVisible () {
      const batch = this.currentOutboundBatch
      return !!(batch && Math.abs(this.parseAmountValue(batch.bankAmountDiff)) >= 0.01)
    },
    bankSlipDetailDiffVisible () {
      const batch = this.bankSlipDetailBatch
      return !!(batch && Math.abs(this.parseAmountValue(batch.bankAmountDiff)) >= 0.01)
    },
    currentOutboundScan () {
      const batch = this.currentOutboundBatch
      return batch ? batch.scan : null
    },
    currentOutboundScanList () {
      const batch = this.currentOutboundBatch
      if (!batch) return []
      if (batch.scanList && batch.scanList.length) return batch.scanList
      return batch.scan ? [batch.scan] : []
    },
    currentOutboundScanTotalBoxes () {
      return this.currentOutboundScanList.reduce((sum, item) => sum + this.toNumber(item.totalBoxes), 0)
    },
    currentOutboundScanTotalWeight () {
      return this.currentOutboundScanList.reduce((sum, item) => sum + this.toNumber(item.totalWeight), 0)
    },
    currentOutboundHasReceiptFile () {
      return this.currentOutboundReceiptFiles.length > 0
    },
    confirmedOutboundReceiptItemList () {
      const list = this.dataForm.outboundBatchList || []
      const result = []
      list.forEach(batch => {
        if (Number(batch.status || 0) !== 3 || !batch.receipt || !batch.receipt.itemList) return
        batch.receipt.itemList.forEach(item => {
          result.push(Object.assign({}, item, {
            batchId: batch.id,
            batchNo: batch.batchNo,
            _batch: batch
          }))
        })
      })
      return result
    },
    confirmedOutboundBatchList () {
      const list = this.dataForm.outboundBatchList || []
      return list.filter(batch => Number(batch.status || 0) === 3).map(batch => {
        const receiptItemList = batch.receipt && batch.receipt.itemList ? batch.receipt.itemList : []
        return Object.assign({}, batch, {
          receiptItemList,
          receiptFileList: batch.receiptFileList || [],
          shippedTotalBoxes: receiptItemList.reduce((sum, item) => sum + this.toNumber(item.shippedQty), 0),
          shippedTotalWeight: receiptItemList.reduce((sum, item) => sum + this.toNumber(item.totalWeight), 0)
        })
      })
    },
    outboundReceiptEditable () {
      return this.attachmentEditable && this.currentOutboundBatchEditable
    },
    globalRequestLoading () {
      return this.globalLoadingCount > 0
    },
    dialogLoading () {
      return this.detailLoading || this.globalRequestLoading
    },
    outboundReceiptMatched () {
      const summaryList = this.dataForm.outboundSummaryList || []
      if (!summaryList.length) return false
      return summaryList.every(item => this.toNumber(item.expectedBoxes) > 0 && this.toNumber(item.expectedBoxes) === this.toNumber(item.shippedQty))
    },
    outboundShippedTotalBoxes () {
      const receipt = this.dataForm.outboundReceipt
      if (!receipt || !receipt.itemList) return 0
      return receipt.itemList.reduce((total, item) => total + Number(item.shippedQty || 0), 0)
    },
    outboundAdjustmentTotal () {
      if (!this.outboundAdjustmentReady) return 0
      const summaryList = this.dataForm.outboundSummaryList || []
      const total = summaryList.reduce((sum, item) => sum + this.toNumber(item.adjustmentAmount), 0)
      return Number(total.toFixed(2))
    },
    outboundAdjustmentReady () {
      return this.outboundReceiptMatched
    },
    outboundReceiptMatchMessage () {
      const summaryList = this.dataForm.outboundSummaryList || []
      if (!summaryList.length) return '-'
      const saleBoxes = summaryList.reduce((sum, item) => sum + this.toNumber(item.expectedBoxes), 0)
      const shippedBoxes = summaryList.reduce((sum, item) => sum + this.toNumber(item.shippedQty), 0)
      if (summaryList.every(item => this.toNumber(item.expectedBoxes) > 0 && this.toNumber(item.expectedBoxes) === this.toNumber(item.shippedQty))) {
        return '销售单箱数与所有出库批次实际箱数一致'
      }
      return `销售单箱数${saleBoxes}箱，所有出库批次实际箱数${shippedBoxes}箱，请核对`
    },
    spotAllocationSummaryKey () {
      if (!this.isSpotSale) return ''
      return (this.dataForm.allocationItemList || []).map(item => {
        const productKey = item.productId ? `id:${item.productId}` : `code:${item.productCode || ''}`
        return `${item._sourceKey || this.saleStockSourceKey(item)}|${productKey}|${Number(item.boxes || 0)}`
      }).join('||')
    },
    canConfirmOutboundBatch () {
      const batch = this.currentOutboundBatch
      if (!batch || !this.currentOutboundBatchEditable) return false
      const receipt = this.dataForm.outboundReceipt
      const hasReceipt = !!(receipt && receipt.itemList && receipt.itemList.length)
      const hasBankSlip = !!batch.bankSlipFileId || !!batch.bankSlipFile
      return hasReceipt && hasBankSlip && this.currentOutboundHasReceiptFile
    }
  },
  watch: {
    spotAllocationSummaryKey (value, oldValue) {
      if (value === oldValue || !this.isSpotSale) return
      this.$nextTick(() => this.rebuildSpotProductSummary())
    }
  },
  methods: {
    withGlobalLoading (request) {
      this.globalLoadingCount += 1
      const promise = typeof request === 'function' ? request() : request
      return Promise.resolve(promise).then(result => {
        this.globalLoadingCount = Math.max(0, this.globalLoadingCount - 1)
        return result
      }).catch(error => {
        this.globalLoadingCount = Math.max(0, this.globalLoadingCount - 1)
        throw error
      })
    },
    defaultForm () {
      return {
        id: 0,
        orderNo: '',
        saleType: 'SPOT',
        sellingEntityId: '',
        sellingEntityName: '',
        secondaryPartnerId: '',
        secondaryPartnerName: '',
        secondaryPartnerColdStorageFreeDays: '',
        salespersonId: '',
        salespersonName: '',
        warehouseId: '',
        warehouseName: '',
        sourcePresaleOrderId: '',
        sourcePresaleOrderNo: '',
        contractNo: '',
        contractToken: '',
        contractUrl: '',
        buyerPortalUrl: '',
        contractSignDate: '',
        status: 1,
        signedContractConfirmed: 0,
        buyerPaymentConfirmed: 0,
        buyerBankConfirmed: 0,
        funderPaymentConfirmed: 0,
        paymentMode: 1,
        fullPaymentFileId: '',
        fullPaymentVoucherTemplate: '',
        fullPaymentPayerNameRecognized: '',
        fullPaymentPayerNameModified: '',
        fullPaymentPayeeNameRecognized: '',
        fullPaymentPayeeNameModified: '',
        fullPaymentAmountRecognized: null,
        fullPaymentAmountModified: null,
        fullPaymentDateRecognized: '',
        fullPaymentDateModified: '',
        fullPaymentSerialNoRecognized: '',
        fullPaymentSerialNoModified: '',
        fullPaymentExpectedAmount: 0,
        fullPaymentAmountDiff: 0,
        fullPaymentRawText: '',
        fullPaymentFile: null,
        fullPaymentUploaded: 0,
        outboundBatchCount: 0,
        outboundReceiptConfirmed: 0,
        allocationStatus: '',
        inventoryLocked: 0,
        riskRequired: 0,
        riskStatus: '',
        riskReason: '',
        riskAuditList: [],
        remark: '',
        itemList: [],
        allocationItemList: [],
        fileList: [],
        outboundReceipt: null,
        outboundBatchList: [],
        outboundSummaryList: []
      }
    },
    defaultItemRow () {
      return {
        id: 0,
        productId: '',
        productCode: '',
        productName: '',
        productNameEn: '',
        marketCirculationName: '',
        productSpec: '',
        unit: '',
        boxes: 0,
        salePriceKg: null,
        contractQuantityKg: null,
        contractFactoryNo: '',
        contractPortCold: '',
        sourcePresaleOrderId: '',
        sourcePresaleOrderNo: '',
        sourcePresaleOrderItemId: '',
        sourceContainerNo: '',
        expiryDate: '',
        remark: '',
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: [],
        _presaleKeyword: '',
        _presaleLoading: false,
        _presaleOptions: []
      }
    },
    defaultAllocationRow () {
      return {
        id: 0,
        lineNo: 0,
        productId: '',
        productCode: '',
        productName: '',
        productNameEn: '',
        marketCirculationName: '',
        productSpec: '',
        unit: '',
        boxes: 0,
        sourceInboundOrderId: '',
        sourceInboundItemId: '',
        sourcePackingItemId: '',
        sourcePackingBatchId: '',
        sourceAdjustmentItemId: '',
        sourceContainerNo: '',
        confirmContractNo: '',
        warehouseId: '',
        warehouseName: '',
        brandId: '',
        brandName: '',
        ownershipName: '',
        confirmExpectedArrivalDate: '',
        inboundDate: '',
        productionDate: '',
        expiryDate: '',
        specWeight: null,
        availableBoxes: 0,
        availableWeightKg: 0,
        estimatedUnitWeightKg: 0,
        expired: 0,
        _sourceKey: '',
        salePriceKg: null,
        contractQuantityKg: null,
        contractFactoryNo: '',
        contractPortCold: '',
        remark: ''
      }
    },
    defaultOutboundReceiptItemRow () {
      return {
        id: 0,
        lineNo: 0,
        wmsOrderNo: '',
        outboundOrderNo: '',
        customerCode: '',
        customerName: '',
        productId: '',
        productCode: '',
        recognizedProductCode: '',
        productName: '',
        productNameEn: '',
        marketCirculationName: '',
        productSpec: '',
        unit: '',
        orderQty: null,
        shippedQty: null,
        containerNo: '',
        factoryNo: '',
        avgWeight: null,
        totalWeight: null,
        contractNo: '',
        expectedFactoryNo: '',
        expectedContainerNo: '',
        expectedBoxes: 0,
        expectedWeight: 0,
        salePriceKg: 0,
        planItemId: '',
        planMatchStatus: '待匹配',
        diffBoxes: 0,
        diffWeight: 0,
        adjustmentAmount: 0,
        _productKeyword: '',
        _productPageSize: 15,
        _productLoading: false,
        _productOptions: []
      }
    },
    init (id, readonly) {
      this.visible = true
      this.readonly = readonly
      this.currentUploadType = ''
      this.currentConfirmType = ''
      this.activeOutboundBatchId = ''
      this.spotProductId = ''
      this.spotProductOptions = []
      this.spotProductRequestSeq++
      this.spotContractRequestSeq++
      this.spotContractList = []
      this.spotAllocationTableVersion++
      this.spotPricingDialogVisible = false
      this.spotPricingMode = 'ADD'
      this.spotPricingCandidates = []
      this.spotPricingRows = []
      this.spotPricingDetailRows = []
      this.spotSummaryDialogVisible = false
      this.dataForm = this.defaultForm()
      this.detailLoading = true
      Promise.all([this.loadBaseOptions(), this.fetchDetail(id)]).finally(() => {
        this.detailLoading = false
      })
    },
    loadBaseOptions () {
      return Promise.all([this.loadInternalEntities(), this.loadSecondaryPartners(), this.loadWarehouses(), this.loadProductList(), this.remoteSearchSalespersons('')])
    },
    loadInternalEntities () {
      return this.$http({
        url: this.$http.adornUrl('/erp/internalentity/select'),
        method: 'get'
      }).then(({ data }) => {
        this.internalEntityList = (data && data.list) || []
        if (!this.dataForm.sellingEntityId) {
          const defaultEntity = this.internalEntityList.find(item => Number(item.defaultFlag) === 1) || this.internalEntityList[0]
          if (defaultEntity) {
            this.dataForm.sellingEntityId = defaultEntity.id
            this.dataForm.sellingEntityName = defaultEntity.entityName
          }
        }
      })
    },
    sellingEntityChangeHandle (value) {
      const entity = this.internalEntityList.find(item => String(item.id) === String(value))
      this.dataForm.sellingEntityName = entity ? entity.entityName : ''
    },
    loadSecondaryPartners () {
      return this.$http({
        url: this.$http.adornUrl('/erp/partner/select'),
        method: 'get',
        params: this.$http.adornParams({ businessRole: 'SECONDARY' })
      }).then(({ data }) => {
        this.secondaryPartnerList = (data && data.list) || []
        if (this.dataForm.secondaryPartnerId) {
          this.dataForm.secondaryPartnerColdStorageFreeDays = this.findSecondaryPartnerColdStorageFreeDays(this.dataForm.secondaryPartnerId)
        }
      })
    },
    loadWarehouses () {
      return this.$http({
        url: this.$http.adornUrl('/erp/warehouse/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.warehouseList = (data && data.list) || []
      })
    },
    loadProductList () {
      return this.$http({
        url: this.$http.adornUrl('/erp/product/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.productList = (data && data.list) || []
      })
    },
    salespersonVisibleChange (visible) {
      if (visible && !this.salespersonOptions.length) {
        this.remoteSearchSalespersons('')
      }
    },
    remoteSearchSalespersons (keyword) {
      this.salespersonLoading = true
      return this.$http({
        url: this.$http.adornUrl('/erp/salesperson/select'),
        method: 'get',
        params: this.$http.adornParams({
          keyword: keyword || ''
        })
      }).then(({ data }) => {
        const list = (data && data.page && data.page.list) || []
        const current = this.dataForm && this.dataForm.salespersonId ? [{
          id: this.dataForm.salespersonId,
          salesName: this.dataForm.salespersonName,
          mobile: '',
          sysUsername: ''
        }] : []
        const merged = current.concat(list)
        const seen = {}
        this.salespersonOptions = merged.filter(item => {
          if (!item || !item.id || seen[item.id]) return false
          seen[item.id] = true
          return true
        })
      }).finally(() => {
        this.salespersonLoading = false
      })
    },
    salespersonChangeHandle (value) {
      const target = (this.salespersonOptions || []).find(item => item.id === value)
      this.dataForm.salespersonName = target ? target.salesName : ''
    },
    salespersonLabel (item) {
      if (!item) return ''
      return item.mobile ? `${item.salesName} / ${item.mobile}` : item.salesName
    },
    paymentModeChangeHandle (value) {
      const mode = Number(value || 1)
      this.dataForm.paymentMode = mode
      if (!this.dataForm.id) return
      if (this.paymentModeLocked) {
        this.$message.warning('已有出库批次，收款方式不可修改')
        this.refreshDetail()
        return
      }
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/payment-mode/update'),
        method: 'post',
        data: this.$http.adornData({
          saleOrderId: this.dataForm.id,
          paymentMode: mode
        })
      })).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('收款方式已更新')
          this.dataForm = this.normalizeForm(data.saleOrder || this.dataForm)
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '收款方式更新失败')
          this.refreshDetail()
        }
      }).catch(() => {
        this.refreshDetail()
      })
    },
    openFullPaymentDialog () {
      this.fullPaymentDialogVisible = true
    },
    triggerFullPaymentUpload () {
      if (!this.dataForm.id) {
        this.$message.error('请先保存销售单')
        return
      }
      this.currentUploadType = 'FULL_PAYMENT_VOUCHER'
      this.$nextTick(() => {
        if (this.$refs.fullPaymentUploadInput) {
          this.$refs.fullPaymentUploadInput.value = ''
          this.$refs.fullPaymentUploadInput.click()
        }
      })
    },
    fullPaymentUploadChangeHandle (event) {
      const files = Array.from((event.target && event.target.files) || [])
      if (!files.length || !this.dataForm.id) return
      const formData = new FormData()
      formData.append('saleOrderId', this.dataForm.id)
      formData.append('file', files[0])
      this.uploadLoading = true
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/full-payment/upload'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 1000 * 120
      })).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('全款水单识别成功')
          this.dataForm = this.normalizeForm(data.saleOrder || this.dataForm)
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '全款水单识别失败')
        }
        this.uploadLoading = false
        this.currentUploadType = ''
      }).catch(() => {
        this.uploadLoading = false
        this.currentUploadType = ''
      })
    },
    saveFullPaymentVoucher () {
      if (!this.dataForm.id) return
      this.fullPaymentSaving = true
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/full-payment/save'),
        method: 'post',
        data: this.$http.adornData({
          id: this.dataForm.id,
          fullPaymentPayerNameModified: this.dataForm.fullPaymentPayerNameModified,
          fullPaymentPayeeNameModified: this.dataForm.fullPaymentPayeeNameModified,
          fullPaymentAmountModified: this.parseAmountValue(this.dataForm.fullPaymentAmountModified),
          fullPaymentDateModified: this.dataForm.fullPaymentDateModified,
          fullPaymentSerialNoModified: this.dataForm.fullPaymentSerialNoModified
        })
      })).then(({ data }) => {
        if (data && data.code === 0) {
          this.$message.success('全款水单确认结果已保存')
          this.dataForm = this.normalizeForm(data.saleOrder || this.dataForm)
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '保存失败')
        }
        this.fullPaymentSaving = false
      }).catch(() => {
        this.fullPaymentSaving = false
      })
    },
    fetchDetail (id) {
      if (!id) {
        this.dataForm.itemList = [this.defaultItemRow()]
        return Promise.resolve()
      }
      return this.$http({
        url: this.$http.adornUrl(`/erp/saleorder/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm = this.normalizeForm(data.saleOrder || {})
          this.outboundTableVersion += 1
        } else {
          this.$message.error((data && data.msg) || '加载失败')
        }
      })
    },
    normalizeForm (form) {
      const source = form || {}
      const previousActiveOutboundBatchId = this.activeOutboundBatchId
      const result = Object.assign(this.defaultForm(), source)
      result.contractSignDate = this.normalizeDateValue(source.contractSignDate)
      result.fileList = source.fileList || []
      if (result.salespersonId && !this.salespersonOptions.some(item => item.id === result.salespersonId)) {
        this.salespersonOptions.unshift({
          id: result.salespersonId,
          salesName: result.salespersonName,
          mobile: '',
          sysUsername: ''
        })
      }
      result.outboundSummaryList = (source.outboundSummaryList || []).map(item => Object.assign({}, item))
      result.outboundBatchList = (source.outboundBatchList || []).map(item => this.normalizeOutboundBatch(item))
      const openBatchList = result.outboundBatchList.filter(item => {
        const status = Number(item.status || 0)
        return status !== 3 && status !== 9
      })
      const activeOpenBatch = openBatchList.find(item => String(item.id) === String(previousActiveOutboundBatchId))
      const openBatch = activeOpenBatch || openBatchList[0]
      if (openBatch) {
        this.activeOutboundBatchId = openBatch.id
        result.outboundReceipt = this.normalizeOutboundReceipt(openBatch.receipt)
      } else {
        this.activeOutboundBatchId = ''
        result.outboundReceipt = null
      }
      result.itemList = (source.itemList || []).map(item => {
        const row = Object.assign(this.defaultItemRow(), item)
        row._productOptions = row.productId ? [{
          id: row.productId,
          productCode: row.productCode,
          productName: row.productName,
          productNameEn: row.productNameEn,
          productSpec: row.productSpec,
          unit: row.unit
        }] : []
        return row
      })
      result.allocationItemList = (source.allocationItemList || []).map(item => {
        const row = Object.assign(this.defaultAllocationRow(), item)
        row._sourceKey = this.saleStockSourceKey(row)
        row.availableBoxes = Number(row.availableBoxes || row.boxes || 0)
        row.availableWeightKg = Number(row.availableWeightKg || row.contractQuantityKg || 0)
        row.estimatedUnitWeightKg = Number(row.estimatedUnitWeightKg || (row.boxes > 0 ? Number(row.contractQuantityKg || 0) / Number(row.boxes) : 0))
        return row
      })
      result.secondaryPartnerColdStorageFreeDays = this.findSecondaryPartnerColdStorageFreeDays(result.secondaryPartnerId)
      if (result.saleType === 'FUTURES' && result.itemList.length) {
        const firstItem = result.itemList[0] || {}
        result.sourcePresaleOrderId = result.sourcePresaleOrderId || firstItem.sourcePresaleOrderId || ''
        result.sourcePresaleOrderNo = result.sourcePresaleOrderNo || firstItem.sourcePresaleOrderNo || ''
        this.ensureCurrentPresaleOrderOption(result)
      }
      if (!result.itemList.length && result.saleType !== 'SPOT') {
        result.itemList = [this.defaultItemRow()]
      }
      return result
    },
    normalizeOutboundReceipt (receipt) {
      if (!receipt) return null
      const result = Object.assign({}, receipt)
      result.itemList = (receipt.itemList || []).map(item => {
        const row = Object.assign(this.defaultOutboundReceiptItemRow(), item)
        row._productOptions = row.productId ? [{
          id: row.productId,
          productCode: row.productCode,
          productName: row.productName,
          productNameEn: row.productNameEn,
          productSpec: row.productSpec,
          unit: row.unit
        }] : []
        return row
      })
      return result
    },
    normalizeOutboundBatch (batch) {
      const result = Object.assign({
        id: '',
        saleOrderId: '',
        batchNo: '',
        status: 0,
        outboundDate: '',
        driverId: '',
        driverName: '',
        plateNo: '',
        driverMobile: '',
        ownershipName: '',
        remark: '',
        planItemList: [],
        bankSlipFileId: '',
        receiptCount: 0,
        shippedTotalBoxes: 0,
        shippedTotalWeight: 0,
        bankVoucherTemplate: '',
        bankPayerNameRecognized: '',
        bankPayerNameModified: '',
        bankPayeeNameRecognized: '',
        bankPayeeNameModified: '',
        bankAmountRecognized: '',
        bankAmountModified: '',
        bankPaymentDateRecognized: '',
        bankPaymentDateModified: '',
        bankSerialNoRecognized: '',
        bankSerialNoModified: '',
        bankExpectedAmount: 0,
        bankAmountDiff: 0,
        secondaryInterestDays: 0,
        secondaryInterestAmount: 0,
        secondaryStorageDays: 0,
        secondaryStorageAmount: 0,
        secondaryFeeAmount: 0,
        secondaryFeeRemark: '',
        receipt: null,
        bankSlipFile: null,
        scan: null,
        scanList: [],
        receiptFileList: [],
        expenseList: []
      }, batch || {})
      result.receipt = this.normalizeOutboundReceipt(result.receipt)
      result.receiptFileList = result.receiptFileList || []
      result.expenseList = result.expenseList || []
      result.planItemList = result.planItemList || []
      result.scanList = result.scanList && result.scanList.length ? result.scanList : (result.scan ? [result.scan] : [])
      result.scan = result.scan || (result.scanList.length ? result.scanList[result.scanList.length - 1] : null)
      return result
    },
    setActiveOutboundBatch () {
      const batch = this.currentOutboundBatch
      this.dataForm.outboundReceipt = batch ? this.normalizeOutboundReceipt(batch.receipt) : null
      this.layoutOutboundTables()
    },
    selectOutboundBatch (batch) {
      if (!batch || !batch.id) return
      this.activeOutboundBatchId = batch.id
      this.setActiveOutboundBatch()
    },
    outboundBatchTagType (batch) {
      const status = Number((batch && batch.status) || 0)
      if (status === 3) return 'success'
      if (status === 9) return 'info'
      if (status === 2) return 'warning'
      return 'danger'
    },
    layoutOutboundTables () {
      this.$nextTick(() => {
        this.$nextTick(() => {
          ;['outboundSummaryTable', 'outboundHistoryTable', 'outboundReceiptTable'].forEach(refName => {
            const table = this.$refs[refName]
            if (table && table.doLayout) {
              table.doLayout()
            }
          })
        })
      })
    },
    formatOutboundBatchStatus (status) {
      const map = {
        0: '待上传回单',
        1: '待上传水单',
        2: '待确认',
        3: '已完成',
        9: '已作废'
      }
      return map[Number(status || 0)] || '待处理'
    },
    toNumber (value) {
      const numberValue = Number(value)
      return Number.isFinite(numberValue) ? numberValue : 0
    },
    formatNumber (value, precision) {
      return this.toNumber(value).toFixed(precision)
    },
    formatBatchExpenseAmount (batch) {
      const total = (batch && batch.expenseList ? batch.expenseList : []).reduce((sum, item) => {
        return sum + this.toNumber(item.totalAmount)
      }, 0)
      return total.toFixed(2)
    },
    formatInteger (value) {
      return String(Math.trunc(this.toNumber(value)))
    },
    calcOutboundDiffBoxes (row) {
      return this.toNumber(row && row.expectedBoxes) - this.toNumber(row && row.shippedQty)
    },
    calcOutboundDiffWeight (row) {
      return Number((this.toNumber(row && row.expectedWeight) - this.toNumber(row && row.totalWeight)).toFixed(3))
    },
    calcOutboundAdjustmentAmount (row) {
      return Number((this.calcOutboundDiffWeight(row) * this.toNumber(row && row.salePriceKg)).toFixed(2))
    },
    normalizeOutboundContainerNo (value) {
      return String(value || '').replace(/\s+/g, '').toUpperCase()
    },
    outboundExpectedSourceItems () {
      if (this.isSpotSale && this.dataForm.allocationItemList && this.dataForm.allocationItemList.length) {
        return this.dataForm.allocationItemList
      }
      return this.dataForm.itemList || []
    },
    findOutboundExpectedSaleItem (row) {
      if (!row || !row.productId) return null
      const batch = this.currentOutboundBatch
      const planItems = batch && batch.planItemList ? batch.planItemList : []
      if (planItems.length) {
        const productPlans = planItems.filter(item => String(item.productId) === String(row.productId))
        if (!productPlans.length) return null
        const containerNo = this.normalizeOutboundContainerNo(row.containerNo)
        const factoryNo = this.normalizeOutboundContainerNo(row.factoryNo)
        const exact = productPlans.find(item => {
          const containerMatched = !containerNo || this.normalizeOutboundContainerNo(item.containerNo) === containerNo
          const factoryMatched = !factoryNo || this.normalizeOutboundContainerNo(item.factoryNo) === factoryNo
          return containerMatched && factoryMatched
        })
        return exact || (productPlans.length === 1 ? productPlans[0] : null)
      }
      const sourceItems = this.outboundExpectedSourceItems()
      const productItems = sourceItems.filter(item => String(item.productId) === String(row.productId))
      if (!productItems.length) return null
      const containerNo = this.normalizeOutboundContainerNo(row.containerNo)
      if (containerNo) {
        const containerMatched = productItems.find(item => this.normalizeOutboundContainerNo(item.sourceContainerNo) === containerNo)
        if (containerMatched) return containerMatched
      }
      return productItems[0]
    },
    applyOutboundExpectedByProduct (row) {
      const saleItem = this.findOutboundExpectedSaleItem(row)
      if (!saleItem) {
        this.$set(row, 'expectedFactoryNo', '')
        this.$set(row, 'expectedContainerNo', '')
        this.$set(row, 'expectedBoxes', 0)
        this.$set(row, 'expectedWeight', 0)
        this.$set(row, 'salePriceKg', 0)
        this.$set(row, 'planItemId', '')
        this.$set(row, 'planMatchStatus', '计划外出库')
        return
      }
      this.$set(row, 'contractNo', this.dataForm.contractNo || this.dataForm.orderNo || '')
      const isPlan = Object.prototype.hasOwnProperty.call(saleItem, 'plannedBoxes')
      this.$set(row, 'planItemId', isPlan ? saleItem.id : (row.planItemId || ''))
      this.$set(row, 'planMatchStatus', isPlan ? '已匹配' : (row.planMatchStatus || '待匹配'))
      this.$set(row, 'expectedFactoryNo', (isPlan ? saleItem.factoryNo : saleItem.contractFactoryNo) || '')
      this.$set(row, 'expectedContainerNo', (isPlan ? saleItem.containerNo : saleItem.sourceContainerNo) || '')
      this.$set(row, 'expectedBoxes', Number((isPlan ? saleItem.plannedBoxes : saleItem.boxes) || 0))
      this.$set(row, 'expectedWeight', Number((isPlan ? saleItem.plannedWeight : saleItem.contractQuantityKg) || 0))
      this.$set(row, 'salePriceKg', Number(saleItem.salePriceKg || 0))
      const expectedFactory = isPlan ? saleItem.factoryNo : saleItem.contractFactoryNo
      if (!row.factoryNo && expectedFactory) {
        this.$set(row, 'factoryNo', expectedFactory)
      }
    },
    saleTypeChangeHandle (value) {
      if (value !== 'SPOT') {
        this.dataForm.warehouseId = ''
        this.dataForm.warehouseName = ''
        this.dataForm.allocationItemList = []
        this.spotContractList = []
        this.spotProductId = ''
      }
      if (value !== 'FUTURES') {
        this.dataForm.sourcePresaleOrderId = ''
        this.dataForm.sourcePresaleOrderNo = ''
      }
      this.dataForm.itemList = value === 'SPOT' ? [] : [this.defaultItemRow()]
    },
    secondaryPartnerChangeHandle (value) {
      const partner = this.secondaryPartnerList.find(item => String(item.id) === String(value))
      this.dataForm.secondaryPartnerName = partner ? partner.partnerName : ''
      this.dataForm.secondaryPartnerColdStorageFreeDays = partner ? (partner.coldStorageFreeDays || 7) : ''
      this.warnSecondaryPartnerRisk(partner)
    },
    findSecondaryPartnerColdStorageFreeDays (partnerId) {
      const partner = this.secondaryPartnerList.find(item => String(item.id) === String(partnerId))
      return partner ? (partner.coldStorageFreeDays || 7) : ''
    },
    partnerRiskLabel (value) {
      const map = { NORMAL: '正常', WATCH: '关注', DEFAULTED: '违约', BLACKLIST: '黑名单' }
      return map[value] || '正常'
    },
    partnerRiskTagType (value) {
      const map = { NORMAL: 'success', WATCH: 'warning', DEFAULTED: 'danger', BLACKLIST: 'info' }
      return map[value] || 'success'
    },
    warnSecondaryPartnerRisk (partner) {
      if (!partner || !partner.riskLevel || partner.riskLevel === 'NORMAL') {
        return
      }
      const message = `二批商【${partner.partnerName || ''}】风险标记：${this.partnerRiskLabel(partner.riskLevel)}${partner.riskRemark ? '；说明：' + partner.riskRemark : ''}`
      this.$message({
        type: partner.riskLevel === 'WATCH' ? 'warning' : 'error',
        message,
        duration: 6000,
        showClose: true
      })
    },
    warehouseChangeHandle (value) {
      const warehouse = this.warehouseList.find(item => String(item.id) === String(value))
      this.dataForm.warehouseName = warehouse ? warehouse.warehouseName : ''
      if (this.isSpotSale && !this.contentReadonly) {
        this.dataForm.allocationItemList = []
      }
    },
    addItemRow () {
      this.dataForm.itemList.push(this.defaultItemRow())
    },
    removeItemRow (index) {
      const removed = this.dataForm.itemList[index]
      this.dataForm.itemList.splice(index, 1)
      if (!this.dataForm.itemList.length) {
        this.dataForm.itemList.push(this.defaultItemRow())
      }
      if (this.isSpotSale && removed && removed.productId) {
        this.dataForm.allocationItemList = (this.dataForm.allocationItemList || []).filter(item => String(item.productId) !== String(removed.productId))
      }
    },
    spotTopRowChange () {
      if (this.isSpotSale && !this.contentReadonly) {
        this.dataForm.allocationItemList = []
      }
    },
    spotSalePriceChange (row) {
      if (!this.isSpotSale) return
      ;(this.dataForm.allocationItemList || []).forEach(item => {
        if (String(item.productId) === String(row.productId)) {
          item.salePriceKg = row.salePriceKg
        }
      })
    },
    productSelectVisibleChange (row, visible) {
      if (!visible || this.contentReadonly) return
      if (row._productOptions.length > 0) return
      row._productKeyword = row.productCode || ''
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
          limit: row._productPageSize,
          keyword: row._productKeyword
        })
      }).then(({ data }) => {
        row._productOptions = data && data.code === 0 ? (data.page.list || []) : []
        row._productLoading = false
      }).catch(() => {
        row._productOptions = []
        row._productLoading = false
      })
    },
    productSelectChange (row, value) {
      const product = row._productOptions.find(item => String(item.id) === String(value)) ||
        this.productList.find(item => String(item.id) === String(value))
      if (!product) {
        row.productId = ''
        row.productCode = ''
        row.productName = ''
        row.productNameEn = ''
        row.marketCirculationName = ''
        row.productSpec = ''
        row.unit = ''
        row.sourcePresaleOrderItemId = ''
        if (this.isSpotSale) {
          this.dataForm.allocationItemList = []
        }
        return
      }
      this.applyProductToRow(row, product)
      if (this.isFuturesSale) {
      } else {
        this.dataForm.allocationItemList = []
      }
    },
    applyProductToRow (row, product) {
      row.productId = product.id
      row.productCode = product.productCode
      row.productName = product.productName || ''
      row.productNameEn = product.productNameEn || ''
      row.marketCirculationName = product.marketCirculationName || ''
      row.productSpec = product.productSpec || ''
      row.unit = product.unit || ''
      if (!row._productOptions.find(item => String(item.id) === String(product.id))) {
        row._productOptions = [product].concat(row._productOptions)
      }
    },
    addOutboundReceiptItemRow () {
      if (!this.dataForm.outboundReceipt) return
      if (!this.dataForm.outboundReceipt.itemList) {
        this.$set(this.dataForm.outboundReceipt, 'itemList', [])
      }
      this.dataForm.outboundReceipt.itemList.push(this.defaultOutboundReceiptItemRow())
    },
    removeOutboundReceiptItemRow (index) {
      if (!this.dataForm.outboundReceipt || !this.dataForm.outboundReceipt.itemList) return
      this.dataForm.outboundReceipt.itemList.splice(index, 1)
    },
    outboundReceiptProductVisibleChange (row, visible) {
      if (!visible || !this.outboundReceiptEditable) return
      this.ensureOutboundReceiptProductState(row)
      if (row._productOptions.length > 0) return
      row._productKeyword = row.productCode || row.recognizedProductCode || ''
      this.fetchOutboundReceiptProductOptions(row)
    },
    remoteSearchOutboundReceiptProducts (row, keyword) {
      this.ensureOutboundReceiptProductState(row)
      row._productKeyword = keyword
      this.fetchOutboundReceiptProductOptions(row)
    },
    fetchOutboundReceiptProductOptions (row) {
      this.ensureOutboundReceiptProductState(row)
      const keyword = String(row._productKeyword || '').toLowerCase()
      const plans = this.currentOutboundBatch && this.currentOutboundBatch.planItemList
        ? this.currentOutboundBatch.planItemList
        : []
      const unique = {}
      plans.forEach(item => {
        if (!item.productId || unique[item.productId]) return
        const text = `${item.productCode || ''} ${item.marketCirculationName || ''} ${item.productName || ''} ${item.productNameEn || ''}`.toLowerCase()
        if (keyword && text.indexOf(keyword) < 0) return
        unique[item.productId] = {
          id: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          marketCirculationName: item.marketCirculationName
        }
      })
      row._productOptions = Object.keys(unique).map(key => unique[key]).slice(0, 15)
      row._productLoading = false
    },
    outboundReceiptProductChange (row, value) {
      this.ensureOutboundReceiptProductState(row)
      const product = row._productOptions.find(item => String(item.id) === String(value)) ||
        this.productList.find(item => String(item.id) === String(value))
      if (!product) {
        row.productId = ''
        row.productCode = ''
        row.productName = ''
        row.productNameEn = ''
        row.marketCirculationName = ''
        row.planItemId = ''
        row.planMatchStatus = '计划外出库'
        this.applyOutboundExpectedByProduct(row)
        return
      }
      row.productId = product.id
      row.productCode = product.productCode
      row.productName = product.productName || ''
      row.productNameEn = product.productNameEn || ''
      row.marketCirculationName = product.marketCirculationName || ''
      if (!row._productOptions.find(item => String(item.id) === String(product.id))) {
        row._productOptions = [product].concat(row._productOptions)
      }
      this.applyOutboundExpectedByProduct(row)
    },
    saleProductDisplayName (row) {
      if (!row) return '-'
      return row.marketCirculationName || row.productName || row.productNameEn || '-'
    },
    ensureOutboundReceiptProductState (row) {
      if (!row._productOptions) this.$set(row, '_productOptions', [])
      if (row._productPageSize === undefined) this.$set(row, '_productPageSize', 15)
      if (row._productKeyword === undefined) this.$set(row, '_productKeyword', '')
      if (row._productLoading === undefined) this.$set(row, '_productLoading', false)
    },
    presaleOrderVisibleChange (visible) {
      if (!visible || this.contentReadonly || !this.isFuturesSale) return
      if (this.presaleOrderOptions.length > 0) return
      this.fetchPresaleOrderOptions()
    },
    remoteSearchPresaleOrders (keyword) {
      this.presaleOrderKeyword = keyword
      this.fetchPresaleOrderOptions()
    },
    presaleOrderLabel (item) {
      if (!item) return ''
      return item.sellerContractNo || item.presaleOrderNo || item.sourcePresaleOrderNo || (item.presaleOrderId ? `预销售单ID：${item.presaleOrderId}` : '')
    },
    ensureCurrentPresaleOrderOption (form) {
      if (!form || !form.sourcePresaleOrderId) return
      const options = this.presaleOrderOptions || []
      const index = options.findIndex(item => String(item.presaleOrderId) === String(form.sourcePresaleOrderId))
      if (index >= 0) {
        if (!this.presaleOrderLabel(options[index]) && form.sourcePresaleOrderNo) {
          this.$set(this.presaleOrderOptions, index, Object.assign({}, options[index], {
            sellerContractNo: form.sourcePresaleOrderNo,
            presaleOrderNo: form.sourcePresaleOrderNo
          }))
        }
        return
      }
      this.presaleOrderOptions = [{
        presaleOrderId: form.sourcePresaleOrderId,
        sellerContractNo: form.sourcePresaleOrderNo,
        presaleOrderNo: form.sourcePresaleOrderNo,
        customerReference: form.customerReference || '',
        brandName: form.brandName || ''
      }].concat(options)
    },
    fetchPresaleOrderOptions () {
      this.presaleOrderLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-orders'),
        method: 'get',
        params: this.$http.adornParams({ keyword: this.presaleOrderKeyword })
      }).then(({ data }) => {
        this.presaleOrderOptions = data && data.code === 0 ? (data.list || []) : []
        this.ensureCurrentPresaleOrderOption(this.dataForm)
        this.presaleOrderLoading = false
      }).catch(() => {
        this.presaleOrderOptions = []
        this.ensureCurrentPresaleOrderOption(this.dataForm)
        this.presaleOrderLoading = false
      })
    },
    spotProductVisibleChange (visible) {
      if (visible && !this.spotProductOptions.length) {
        this.remoteSearchSpotProducts('')
      }
    },
    remoteSearchSpotProducts (keyword) {
      const requestSeq = ++this.spotProductRequestSeq
      this.spotProductLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/spot-stock/products'),
        method: 'get',
        params: this.$http.adornParams({ keyword: keyword || '', limit: 15 })
      }).then(({ data }) => {
        if (requestSeq !== this.spotProductRequestSeq) return
        this.spotProductOptions = data && data.code === 0 ? (data.list || []).slice(0, 15) : []
        if (!data || data.code !== 0) {
          this.$message.error((data && data.msg) || '查询可售产品失败')
        }
      }).catch((error) => {
        if (requestSeq !== this.spotProductRequestSeq) return
        this.spotProductOptions = []
        this.$message.error((error && error.message) || '查询可售产品失败，请检查后端服务')
      }).finally(() => {
        if (requestSeq !== this.spotProductRequestSeq) return
        this.spotProductLoading = false
      })
    },
    spotProductChange () {
      this.spotContractRequestSeq++
      this.spotContractLoading = false
      this.spotContractList = []
    },
    saleStockSourceKey (item) {
      item = item || {}
      const value = field => item[field] === null || item[field] === undefined || item[field] === '' ? 0 : item[field]
      return `${value('productId')}:${value('sourceInboundItemId')}:${value('sourcePackingBatchId')}:${value('sourceAdjustmentItemId')}`
    },
    normalizeSpotContractRow (contract, contractIndex) {
      const row = Object.assign({}, contract)
      row._rowKey = `${contract.confirmId || contract.confirmContractNo || contractIndex}:${contract.productId}`
      row._selectedLots = []
      row.lotList = (contract.lotList || []).map(lot => {
        const detail = Object.assign({}, lot)
        detail._sourceKey = this.saleStockSourceKey(detail)
        return detail
      })
      return row
    },
    searchSpotContracts () {
      if (!this.spotProductId) return
      const productId = this.spotProductId
      const requestSeq = ++this.spotContractRequestSeq
      this.spotContractLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/spot-stock/contracts'),
        method: 'get',
        params: this.$http.adornParams({
          productId,
          excludeOrderId: this.dataForm.id || undefined
        })
      }).then(({ data }) => {
        if (requestSeq !== this.spotContractRequestSeq || String(productId) !== String(this.spotProductId)) return
        if (!data || data.code !== 0) {
          this.spotContractList = []
          this.$message.error((data && data.msg) || '查询可售库存失败')
          return
        }
        const list = data && data.code === 0 ? (data.list || []) : []
        this.spotContractList = list.filter(Boolean).map((contract, contractIndex) => this.normalizeSpotContractRow(contract, contractIndex))
        this.spotContractTableVersion++
        if (!this.spotContractList.length) {
          this.$message.warning('当前产品没有可售库存')
        }
        this.$nextTick(() => {
          if (this.$refs.spotContractTable) this.$refs.spotContractTable.doLayout()
        })
      }).catch((error) => {
        if (requestSeq !== this.spotContractRequestSeq || String(productId) !== String(this.spotProductId)) return
        this.spotContractList = []
        this.$message.error((error && error.message) || '查询可售库存失败，请检查后端服务')
      }).finally(() => {
        if (requestSeq !== this.spotContractRequestSeq) return
        this.spotContractLoading = false
      })
    },
    spotLotSelectionChange (contract, selection) {
      this.$set(contract, '_selectedLots', selection || [])
    },
    spotLotSelectable (lot) {
      const key = lot._sourceKey || this.saleStockSourceKey(lot)
      return !(this.dataForm.allocationItemList || []).some(item => (item._sourceKey || this.saleStockSourceKey(item)) === key)
    },
    appendSpotLot (contract, lot) {
      const key = lot._sourceKey || this.saleStockSourceKey(lot)
      const availableBoxes = Number(lot.availableBoxes || 0)
      if (availableBoxes <= 0) return null
      const existing = (this.dataForm.allocationItemList || []).find(item => (item._sourceKey || this.saleStockSourceKey(item)) === key)
      if (existing) return null
      const unitWeight = Number(lot.estimatedUnitWeightKg || (availableBoxes > 0 ? Number(lot.availableWeightKg || 0) / availableBoxes : 0))
      const boxes = 1
      const row = Object.assign(this.defaultAllocationRow(), lot, {
        boxes,
        availableBoxes,
        availableWeightKg: Number(lot.availableWeightKg || 0),
        estimatedUnitWeightKg: unitWeight,
        contractQuantityKg: Number((unitWeight * boxes).toFixed(2)),
        contractFactoryNo: lot.factoryNo || '',
        sourceContainerNo: lot.sourceContainerNo || contract.containerNo || '',
        confirmContractNo: lot.confirmContractNo || contract.confirmContractNo || '',
        confirmExpectedArrivalDate: lot.confirmExpectedArrivalDate || contract.expectedArrivalDate || '',
        _sourceKey: key
      })
      this.dataForm.allocationItemList.push(row)
      return row
    },
    spotProductMatches (left, right) {
      if (!left || !right) return false
      if (left.productId && right.productId) return String(left.productId) === String(right.productId)
      return String(left.productCode || '') === String(right.productCode || '')
    },
    spotCandidateUnitWeight (lot) {
      const availableBoxes = Number((lot && lot.availableBoxes) || 0)
      return Number((lot && lot.estimatedUnitWeightKg) || (availableBoxes > 0 ? Number(lot.availableWeightKg || 0) / availableBoxes : 0))
    },
    existingSpotSalePrice (product) {
      const summary = (this.dataForm.itemList || []).find(item => this.spotProductMatches(item, product))
      if (summary && Number(summary.salePriceKg || 0) > 0) return Number(summary.salePriceKg)
      const allocation = (this.dataForm.allocationItemList || []).find(item => this.spotProductMatches(item, product))
      return allocation && Number(allocation.salePriceKg || 0) > 0 ? Number(allocation.salePriceKg) : null
    },
    openSpotPricingForCandidates (candidates) {
      const selectable = (candidates || []).filter(({ lot }) => this.spotLotSelectable(lot))
      if (!selectable.length) {
        this.$message.warning('所选库存明细已全部加入')
        return
      }
      const first = selectable[0].lot || {}
      const detailRows = selectable.map(({ contract, lot }) => ({
        confirmContractNo: lot.confirmContractNo || contract.confirmContractNo || '',
        warehouseName: lot.warehouseName || '',
        sourceContainerNo: lot.sourceContainerNo || contract.containerNo || '',
        productionDate: lot.productionDate || '',
        expiryDate: lot.expiryDate || '',
        availableBoxes: Number(lot.availableBoxes || 0),
        boxes: Number(lot.availableBoxes || 0),
        estimatedUnitWeightKg: this.spotCandidateUnitWeight(lot),
        _contract: contract,
        _lot: lot,
        _allocationRow: null
      }))
      const expectedWeight = detailRows.reduce((sum, item) => sum + Number(item.estimatedUnitWeightKg || 0) * Number(item.boxes || 0), 0)
      this.spotPricingMode = 'ADD'
      this.spotPricingCandidates = selectable
      this.spotPricingRows = []
      this.spotPricingDetailRows = detailRows
      this.spotPricingForm = {
        productId: first.productId,
        productCode: first.productCode,
        productName: first.productName,
        marketCirculationName: first.marketCirculationName,
        salePriceKg: this.existingSpotSalePrice(first),
        expectedWeightKg: Number(expectedWeight.toFixed(2)),
        selectedBoxes: detailRows.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
      }
      this.spotPricingDialogVisible = true
    },
    editSpotProductPricing (row) {
      const rows = (this.dataForm.allocationItemList || []).filter(item => this.spotProductMatches(item, row))
      if (!rows.length) return
      this.spotPricingMode = 'EDIT'
      this.spotPricingCandidates = []
      this.spotPricingRows = rows
      this.spotPricingDetailRows = rows.map(item => ({
        confirmContractNo: item.confirmContractNo || '',
        warehouseName: item.warehouseName || '',
        sourceContainerNo: item.sourceContainerNo || '',
        productionDate: item.productionDate || '',
        expiryDate: item.expiryDate || '',
        availableBoxes: Number(item.availableBoxes || item.boxes || 0),
        boxes: Number(item.boxes || 0),
        estimatedUnitWeightKg: Number(item.estimatedUnitWeightKg || 0),
        _contract: null,
        _lot: null,
        _allocationRow: item
      }))
      this.spotPricingForm = {
        productId: row.productId,
        productCode: row.productCode,
        productName: row.productName,
        marketCirculationName: row.marketCirculationName,
        salePriceKg: Number(row.salePriceKg || 0) > 0 ? Number(row.salePriceKg) : null,
        expectedWeightKg: Number(rows.reduce((sum, item) => sum + Number(item.contractQuantityKg || 0), 0).toFixed(2)),
        selectedBoxes: rows.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
      }
      this.spotPricingDialogVisible = true
    },
    spotPricingBoxesChange () {
      const detailRows = this.spotPricingDetailRows || []
      this.spotPricingForm.selectedBoxes = detailRows.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
      const expectedWeight = detailRows.reduce((sum, item) => {
        return sum + Number(item.estimatedUnitWeightKg || 0) * Number(item.boxes || 0)
      }, 0)
      this.spotPricingForm.expectedWeightKg = Number(expectedWeight.toFixed(2))
    },
    distributeSpotWeight (rows, totalWeight) {
      const totalCents = Math.round(Number(totalWeight || 0) * 100)
      const totalBoxes = rows.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
      let assignedCents = 0
      rows.forEach((item, index) => {
        const weightCents = index === rows.length - 1
          ? totalCents - assignedCents
          : Math.round(totalBoxes > 0 ? totalCents * Number(item.boxes || 0) / totalBoxes : 0)
        item.contractQuantityKg = weightCents / 100
        assignedCents += weightCents
      })
    },
    confirmSpotPricing () {
      const salePrice = Number(this.spotPricingForm.salePriceKg || 0)
      const expectedWeight = Number(this.spotPricingForm.expectedWeightKg || 0)
      const detailRows = this.spotPricingDetailRows || []
      if (!detailRows.length) {
        this.$message.error('本次库存批次不能为空')
        return
      }
      for (let index = 0; index < detailRows.length; index++) {
        const detail = detailRows[index]
        const boxes = Number(detail.boxes || 0)
        if (!Number.isInteger(boxes) || boxes <= 0) {
          this.$message.error(`第${index + 1}行本次销售箱数必须为大于0的整数`)
          return
        }
        if (Number(detail.availableBoxes || 0) > 0 && boxes > Number(detail.availableBoxes)) {
          this.$message.error(`第${index + 1}行本次销售箱数不能超过可售箱数${detail.availableBoxes}`)
          return
        }
      }
      if (salePrice <= 0) {
        this.$message.error('销售价必须大于0')
        return
      }
      if (expectedWeight <= 0) {
        this.$message.error('预计重量必须大于0')
        return
      }
      const targetCount = detailRows.length
      if (targetCount > 0 && expectedWeight < targetCount / 100) {
        this.$message.error(`预计重量不能小于${(targetCount / 100).toFixed(2)}KG`)
        return
      }
      let rows = this.spotPricingRows || []
      if (this.spotPricingMode === 'ADD') {
        rows = []
        detailRows.forEach(detail => {
          const added = this.appendSpotLot(detail._contract, detail._lot)
          if (added) {
            added.boxes = Number(detail.boxes || 0)
            rows.push(added)
          }
        })
      } else {
        rows = detailRows.map(detail => {
          detail._allocationRow.boxes = Number(detail.boxes || 0)
          return detail._allocationRow
        })
      }
      if (!rows.length) {
        this.$message.warning('没有可处理的库存明细')
        this.spotPricingDialogVisible = false
        return
      }
      const product = rows[0]
      ;(this.dataForm.allocationItemList || []).forEach(item => {
        if (this.spotProductMatches(item, product)) item.salePriceKg = salePrice
      })
      this.distributeSpotWeight(rows, expectedWeight)
      this.$set(this.dataForm, 'allocationItemList', (this.dataForm.allocationItemList || []).slice())
      this.spotAllocationTableVersion++
      this.rebuildSpotProductSummary()
      this.clearSpotContractSelections()
      this.spotPricingDialogVisible = false
      this.$message.success(this.spotPricingMode === 'ADD' ? '销售明细已加入' : '销售价和预计重量已更新')
    },
    addCheckedSpotLots () {
      const selected = []
      ;(this.spotContractList || []).forEach(contract => {
        ;(contract._selectedLots || []).forEach(lot => selected.push({ contract, lot }))
      })
      if (!selected.length) {
        this.$message.warning('请先勾选需要销售的库存批次')
        return
      }
      this.openSpotPricingForCandidates(selected)
    },
    addSearchedProductStock (contract) {
      const lots = (contract && contract.lotList ? contract.lotList : []).filter(lot => this.spotLotSelectable(lot))
      if (!lots.length) {
        this.$message.warning('该合同下当前搜索产品的库存批次已全部加入')
        return
      }
      this.openSpotPricingForCandidates(lots.map(lot => ({ contract, lot })))
    },
    goToSpotProductSummary () {
      if (!(this.dataForm.allocationItemList || []).length) {
        this.$message.warning('请先选择并加入库存产品')
        return
      }
      this.rebuildSpotProductSummary()
      this.spotSummaryDialogVisible = true
    },
    clearSpotContractSelections () {
      ;(this.spotContractList || []).forEach(contract => {
        contract._selectedLots = []
        const table = this.$refs[`spotLots_${contract._rowKey}`]
        const tableRef = Array.isArray(table) ? table[0] : table
        if (tableRef) tableRef.clearSelection()
      })
    },
    removeSpotAllocation (index) {
      this.dataForm.allocationItemList.splice(index, 1)
      this.$set(this.dataForm, 'allocationItemList', this.dataForm.allocationItemList.slice())
      this.spotAllocationTableVersion++
      this.rebuildSpotProductSummary()
    },
    spotAllocationBoxesChange (row) {
      const boxes = Math.max(0, Number(row.boxes || 0))
      row.contractQuantityKg = Number((Number(row.estimatedUnitWeightKg || 0) * boxes).toFixed(2))
      this.rebuildSpotProductSummary()
    },
    rebuildSpotProductSummary () {
      const previous = {}
      ;(this.dataForm.itemList || []).forEach(item => {
        const key = item.productId ? `id:${item.productId}` : `code:${item.productCode || ''}`
        previous[key] = item
      })
      const grouped = {}
      ;(this.dataForm.allocationItemList || []).forEach(allocation => {
        const key = allocation.productId ? `id:${allocation.productId}` : `code:${allocation.productCode || ''}`
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(allocation)
      })
      const summaryList = Object.keys(grouped).map(key => {
        const allocations = grouped[key]
        const first = allocations[0]
        const old = previous[key] || {}
        const boxes = allocations.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
        const estimatedWeight = allocations.reduce((sum, item) => sum + Number(item.contractQuantityKg || 0), 0)
        const row = Object.assign(this.defaultItemRow(), {
          productId: first.productId,
          productCode: first.productCode,
          productName: first.productName,
          productNameEn: first.productNameEn,
          marketCirculationName: first.marketCirculationName,
          productSpec: first.productSpec,
          unit: first.unit,
          boxes,
          salePriceKg: first.salePriceKg,
          contractQuantityKg: Number(estimatedWeight.toFixed(2)),
          remark: old.remark || ''
        })
        allocations.forEach(item => { item.salePriceKg = row.salePriceKg })
        return row
      })
      if (!Array.isArray(this.dataForm.itemList)) {
        this.$set(this.dataForm, 'itemList', [])
      }
      this.dataForm.itemList.splice(0, this.dataForm.itemList.length, ...summaryList)
      this.$nextTick(() => {
        const allocationTable = this.$refs.spotAllocationTable
        if (allocationTable && allocationTable.doLayout) allocationTable.doLayout()
      })
    },
    redistributeSpotProductWeight (productId) {
      const summary = (this.dataForm.itemList || []).find(item => String(item.productId) === String(productId))
      const allocations = (this.dataForm.allocationItemList || []).filter(item => String(item.productId) === String(productId))
      if (!summary || !allocations.length) return
      const totalBoxes = allocations.reduce((sum, item) => sum + Number(item.boxes || 0), 0)
      const totalWeight = Number(summary.contractQuantityKg || 0)
      let assigned = 0
      allocations.forEach((item, index) => {
        const weight = index === allocations.length - 1
          ? Number((totalWeight - assigned).toFixed(2))
          : Number((totalBoxes > 0 ? totalWeight * Number(item.boxes || 0) / totalBoxes : 0).toFixed(2))
        item.contractQuantityKg = Math.max(0, weight)
        assigned += weight
      })
    },
    isExpiredDate (value) {
      if (!value) return false
      const date = new Date(this.normalizeDateValue(value) + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return !Number.isNaN(date.getTime()) && date.getTime() < today.getTime()
    },
    riskActionLabel (value) {
      const map = { SUBMIT: '提交库存分配', APPROVE: '风控通过', REJECT: '风控驳回', FUTURES_ALLOCATE: '期货入库分配' }
      return map[value] || value || '-'
    },
    presaleOrderChangeHandle (value) {
      const item = this.presaleOrderOptions.find(option => String(option.presaleOrderId) === String(value))
      if (!item) {
        this.dataForm.sourcePresaleOrderId = ''
        this.dataForm.sourcePresaleOrderNo = ''
        return
      }
      this.dataForm.sourcePresaleOrderId = item.presaleOrderId
      this.dataForm.sourcePresaleOrderNo = item.sellerContractNo || item.presaleOrderNo || ''
    },
    presaleSelectVisibleChange (row, visible) {
      if (!visible || this.contentReadonly || this.isSpotSale) return
      if (!row.productId) return
      if (row._presaleOptions.length > 0) return
      this.fetchPresaleOptions(row)
    },
    remoteSearchPresaleItems (row, keyword) {
      row._presaleKeyword = keyword
      this.fetchPresaleOptions(row)
    },
    fetchPresaleOptions (row) {
      if (!row.productId) {
        row._presaleOptions = []
        return
      }
      row._presaleLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/saleorder/presale-items'),
        method: 'get',
        params: this.$http.adornParams({
          productId: row.productId,
          keyword: row._presaleKeyword
        })
      }).then(({ data }) => {
        row._presaleOptions = data && data.code === 0 ? (data.list || []) : []
        row._presaleLoading = false
      }).catch(() => {
        row._presaleOptions = []
        row._presaleLoading = false
      })
    },
    presaleSelectChange (row, value) {
      const item = row._presaleOptions.find(option => String(option.presaleOrderItemId) === String(value))
      if (!item) {
        row.sourcePresaleOrderId = ''
        row.sourcePresaleOrderNo = ''
        row.sourcePresaleOrderItemId = ''
        return
      }
      row.sourcePresaleOrderId = item.presaleOrderId
      row.sourcePresaleOrderNo = item.presaleOrderNo
      row.sourcePresaleOrderItemId = item.presaleOrderItemId
    },
    previewSpotAllocation () {
      if (!this.isSpotSale || this.contentReadonly) return
      const previewError = this.validateSpotPreview()
      if (previewError) {
        this.$message.error(previewError)
        return
      }
      this.previewLoading = true
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/preview-allocation'),
        method: 'post',
        data: this.$http.adornData(this.buildPreviewData())
      })).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm.allocationItemList = (data.list || []).map(item => Object.assign(this.defaultAllocationRow(), item))
        } else {
          this.$message.error((data && data.msg) || '生成现货分配明细失败')
        }
        this.previewLoading = false
      }).catch(() => {
        this.previewLoading = false
      })
    },
    validateSpotPreview () {
      if (!this.dataForm.warehouseId) return '请先选择仓库'
      if (!this.dataForm.itemList.length) return '请先录入现货产品明细'
      const productIds = {}
      for (let index = 0; index < this.dataForm.itemList.length; index++) {
        const item = this.dataForm.itemList[index]
        if (!item.productId) return `现货单第${index + 1}行产品未选择`
        if (!item.boxes || Number(item.boxes) <= 0) return `现货单第${index + 1}行箱数必须大于0`
        if (item.salePriceKg === null || item.salePriceKg === '' || Number(item.salePriceKg) <= 0) {
          return `现货单第${index + 1}行销售价（元/千克）必须大于0`
        }
        if (productIds[item.productId]) return '现货单不支持重复录入同一产品，请合并箱数后再生成分配明细'
        productIds[item.productId] = true
      }
      return ''
    },
    buildPreviewData () {
      return {
        saleType: this.dataForm.saleType,
        warehouseId: this.dataForm.warehouseId,
        itemList: (this.dataForm.itemList || []).map((item, index) => ({
          lineNo: index + 1,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          marketCirculationName: item.marketCirculationName,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          remark: item.remark
        })),
        allocationItemList: (this.dataForm.allocationItemList || []).map(item => ({
          sourceInboundItemId: item.sourceInboundItemId,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold
        }))
      }
    },
    validateItemList () {
      const itemList = this.dataForm.itemList || []
      if (!itemList.length) return '销售明细不能为空'
      const productIds = {}
      for (let index = 0; index < itemList.length; index++) {
        const item = itemList[index]
        if (!item.productId) return `第${index + 1}行产品未选择`
        if (!item.boxes || Number(item.boxes) <= 0) return `第${index + 1}行箱数必须大于0`
        if (item.salePriceKg === null || item.salePriceKg === '' || Number(item.salePriceKg) <= 0) {
          return `产品${item.productCode || index + 1}的销售价（元/千克）必须大于0，请在已选库存明细中调整`
        }
        if (this.isSpotSale) {
          if (productIds[item.productId]) return '现货单不支持重复录入同一产品，请合并箱数'
          productIds[item.productId] = true
        } else {
          if (item.contractQuantityKg === null || item.contractQuantityKg === '' || Number(item.contractQuantityKg) <= 0) {
            return `第${index + 1}行数量/千克必须大于0`
          }
          if (!item.contractFactoryNo) return `第${index + 1}行厂号不能为空`
          if (!item.contractPortCold) return `第${index + 1}行港口/冷库不能为空`
        }
      }
      if (this.isSpotSale) {
        const allocationList = this.dataForm.allocationItemList || []
        if (!allocationList.length) return '请先查询库存并勾选需要销售的库存明细'
        for (let index = 0; index < allocationList.length; index++) {
          const item = allocationList[index]
          if (!item.productId || !item.sourceInboundItemId) {
            return `第${index + 1}条库存明细来源不完整，请移除后重新选择`
          }
          if (!item.boxes || Number(item.boxes) <= 0) return `第${index + 1}条库存明细销售箱数必须大于0`
          if (Number(item.availableBoxes || 0) > 0 && Number(item.boxes) > Number(item.availableBoxes)) {
            return `第${index + 1}条库存明细销售箱数不能超过可售箱数${item.availableBoxes}`
          }
          if (item.contractQuantityKg === null || item.contractQuantityKg === '' || Number(item.contractQuantityKg) <= 0) {
            return `第${index + 1}条库存明细预计重量必须大于0`
          }
        }
      }
      return ''
    },
    buildSubmitData () {
      return Object.assign({}, this.dataForm, {
        sourcePresaleOrderId: this.dataForm.sourcePresaleOrderId || null,
        sourcePresaleOrderNo: this.dataForm.sourcePresaleOrderNo || null,
        itemList: (this.dataForm.itemList || []).map((item, index) => ({
          id: item.id,
          lineNo: index + 1,
          saleType: this.dataForm.saleType,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          marketCirculationName: item.marketCirculationName,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold,
          sourcePresaleOrderId: this.dataForm.sourcePresaleOrderId || null,
          sourcePresaleOrderNo: this.dataForm.sourcePresaleOrderNo || null,
          sourcePresaleOrderItemId: item.sourcePresaleOrderItemId || null,
          remark: item.remark
        })),
        allocationItemList: (this.dataForm.allocationItemList || []).map((item, index) => ({
          id: item.id,
          lineNo: index + 1,
          saleType: this.dataForm.saleType,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          marketCirculationName: item.marketCirculationName,
          productSpec: item.productSpec,
          unit: item.unit,
          boxes: item.boxes,
          salePriceKg: item.salePriceKg,
          contractQuantityKg: item.contractQuantityKg,
          contractFactoryNo: item.contractFactoryNo,
          contractPortCold: item.contractPortCold,
          sourceInboundOrderId: item.sourceInboundOrderId,
          sourceInboundItemId: item.sourceInboundItemId,
          sourcePackingItemId: item.sourcePackingItemId,
          sourcePackingBatchId: item.sourcePackingBatchId,
          sourceAdjustmentItemId: item.sourceAdjustmentItemId,
          sourceContainerNo: item.sourceContainerNo,
          confirmContractNo: item.confirmContractNo,
          confirmExpectedArrivalDate: item.confirmExpectedArrivalDate,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouseName,
          brandId: item.brandId,
          brandName: item.brandName,
          ownershipName: item.ownershipName,
          inboundDate: item.inboundDate,
          productionDate: item.productionDate,
          expiryDate: item.expiryDate,
          specWeight: item.specWeight,
          remark: item.remark
        }))
      })
    },
    dataFormSubmit () {
      if (this.contentReadonly) return
      this.$refs.dataForm.validate((valid) => {
        if (!valid) return false
        const itemError = this.validateItemList()
        if (itemError) {
          this.$message.error(itemError)
          return false
        }
        const isCreate = !this.dataForm.id
        this.saveLoading = true
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl(this.dataForm.id ? '/erp/saleorder/update' : '/erp/saleorder/save'),
          method: 'post',
          data: this.$http.adornData(this.buildSubmitData())
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('保存成功')
            this.visible = false
            this.$emit('refreshDataList', { created: isCreate })
          } else {
            this.$message.error((data && data.msg) || '保存失败')
          }
          this.saveLoading = false
        }).catch(() => {
          this.saveLoading = false
        })
      })
    },
    getFileListByType (fileType) {
      return (this.dataForm.fileList || []).filter(item => item.fileType === fileType)
    },
    isStepConfirmed (fileType) {
      if (fileType === 'SIGNED_CONTRACT') return Number(this.dataForm.signedContractConfirmed || 0) === 1
      if (fileType === 'BUYER_PAYMENT_PROOF') return Number(this.dataForm.buyerPaymentConfirmed || 0) === 1
      if (fileType === 'BUYER_BANK_SLIP') return Number(this.dataForm.buyerBankConfirmed || 0) === 1
      if (fileType === 'FUNDER_PAYMENT_PROOF') return Number(this.dataForm.funderPaymentConfirmed || 0) === 1
      if (fileType === 'OUTBOUND_RECEIPT') return Number(this.dataForm.outboundReceiptConfirmed || 0) === 1
      return false
    },
    canConfirmStep (fileType) {
      if (this.isStepConfirmed(fileType)) return false
      if (this.getFileListByType(fileType).length <= 0) return false
      if (fileType === 'SIGNED_CONTRACT') return true
      if (fileType === 'BUYER_PAYMENT_PROOF') return this.isStepConfirmed('SIGNED_CONTRACT')
      if (fileType === 'BUYER_BANK_SLIP') return this.isStepConfirmed('BUYER_PAYMENT_PROOF')
      if (fileType === 'FUNDER_PAYMENT_PROOF') return this.isStepConfirmed('BUYER_BANK_SLIP')
      if (fileType === 'OUTBOUND_RECEIPT') return this.outboundReceiptMatched
      return false
    },
    canDeleteStep (fileType) {
      return !this.isStepConfirmed(fileType)
    },
    canUploadStep (fileType) {
      if (this.isStepConfirmed(fileType)) return false
      if (fileType === 'SIGNED_CONTRACT') return true
      if (fileType === 'BUYER_PAYMENT_PROOF') return this.isStepConfirmed('SIGNED_CONTRACT')
      if (fileType === 'BUYER_BANK_SLIP') return this.isStepConfirmed('BUYER_PAYMENT_PROOF')
      if (fileType === 'FUNDER_PAYMENT_PROOF') return this.isStepConfirmed('BUYER_BANK_SLIP')
      if (fileType === 'OUTBOUND_RECEIPT') return !!this.currentOutboundBatch && this.currentOutboundBatchEditable
      if (fileType === 'OUTBOUND_BATCH_BANK_SLIP') {
        return !!this.currentOutboundBatch && this.currentOutboundBatchEditable
      }
      if (fileType === 'OUTBOUND_ATTACHMENT') return true
      return false
    },
    triggerUpload (fileType) {
      if (!this.attachmentEditable) return
      if (!this.canUploadStep(fileType)) {
        this.$message.error(this.getUploadStepMessage(fileType))
        return
      }
      this.currentUploadType = fileType
      this.$refs.uploadInput.value = ''
      this.$refs.uploadInput.click()
    },
    getUploadStepMessage (fileType) {
      if (this.isStepConfirmed(fileType)) return '该节点已确认，不能重复上传'
      if (fileType === 'BUYER_PAYMENT_PROOF') return '请先上传并确认盖章合同'
      if (fileType === 'BUYER_BANK_SLIP') return '请先上传并确认二批打款凭证'
      if (fileType === 'FUNDER_PAYMENT_PROOF') return '请先上传并确认二批来款水单'
      if (fileType === 'OUTBOUND_RECEIPT') return '请先选择未完成的出库批次'
      if (fileType === 'OUTBOUND_BATCH_BANK_SLIP') return '当前批次不可上传二批来款水单'
      return '当前节点暂不可上传'
    },
    bindOutboundScanLink () {
      if (!this.currentOutboundBatch) return
      this.$prompt('请粘贴顺势云扫码链接，系统会追加保存该链接，并按当前批次所有扫码链接汇总重建出库明细。', '新增扫码链接', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: '',
        inputPlaceholder: 'http://shunshiyun.com/pc/chamaDetails?orderNum=...&imei=...',
        inputValidator: value => {
          if (!value) return '请填写扫码链接'
          if (String(value).indexOf('orderNum=') < 0 || String(value).indexOf('imei=') < 0) return '链接需包含orderNum和imei'
          return true
        }
      }).then(({ value }) => {
        this.outboundBatchLoading = true
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/batch/scan-link/bind'),
          method: 'post',
          data: this.$http.adornData({
            saleOrderId: this.dataForm.id,
            batchId: this.currentOutboundBatch.id,
            scanUrl: value
          })
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('扫码链接新增成功')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '扫码链接新增失败')
          }
          this.outboundBatchLoading = false
        }).catch(() => {
          this.outboundBatchLoading = false
        })
      }).catch(() => {})
    },
    deleteOutboundScanLink (scan) {
      if (!this.currentOutboundBatch || !scan || !scan.id) return
      this.$confirm(`确认删除顺势云扫码链接 ${scan.orderNum || ''}？删除后会按剩余扫码链接重新汇总当前批次出库明细。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.outboundBatchLoading = true
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/batch/scan-link/delete'),
          method: 'post',
          data: this.$http.adornData({
            saleOrderId: this.dataForm.id,
            batchId: this.currentOutboundBatch.id,
            scanId: scan.id
          })
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('扫码链接已删除')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '扫码链接删除失败')
          }
          this.outboundBatchLoading = false
        }).catch(() => {
          this.outboundBatchLoading = false
        })
      }).catch(() => {})
    },
    openOutboundBatchDialog () {
      if (!this.dataForm.id) return
      if (this.isFullPaymentMode && !this.fullPaymentUploaded) {
        this.$message.error('当前为全款付款，请先上传客户全款水单后再新增出库批次')
        this.openFullPaymentDialog()
        return
      }
      this.outboundBatchDialogVisible = true
      this.$nextTick(() => {
        this.$refs.outboundBatchDialog.init(this.dataForm)
      })
    },
    outboundBatchCreated (batch) {
      this.activeOutboundBatchId = batch && batch.id
      this.refreshDetail()
      this.$emit('refreshDataList')
    },
    confirmOutboundBatch () {
      if (!this.currentOutboundBatch) return
      this.confirmLoading = true
      this.currentConfirmType = 'OUTBOUND_BATCH'
      const beforeConfirm = this.dataForm.outboundReceipt
        ? this.saveOutboundReceipt({ silent: true, skipRefresh: true })
        : Promise.resolve(true)
      beforeConfirm.then(saved => {
        if (saved === false) {
          this.confirmLoading = false
          this.currentConfirmType = ''
          return
        }
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/batch/confirm'),
          method: 'post',
          data: this.$http.adornData({ batchId: this.currentOutboundBatch.id })
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('出库批次已确认')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '确认批次失败')
          }
          this.confirmLoading = false
          this.currentConfirmType = ''
        }).catch(() => {
          this.confirmLoading = false
          this.currentConfirmType = ''
        })
      }).catch(() => {
        this.confirmLoading = false
        this.currentConfirmType = ''
      })
    },
    voidOutboundBatch () {
      this.deleteOutboundBatch(this.currentOutboundBatch)
    },
    deleteOutboundBatch (batchOrRow) {
      const batch = batchOrRow && batchOrRow._batch ? batchOrRow._batch : batchOrRow
      if (!batch || !batch.id) return
      this.$confirm(`确认删除出库批次 ${batch.batchNo || ''}？删除后会同步删除该批次出库回单、二批来款水单和识别明细。`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.outboundBatchLoading = true
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl('/erp/saleorder/outbound/batch/void'),
          method: 'post',
          data: this.$http.adornData({ batchId: batch.id })
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('出库批次已删除')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '删除批次失败')
          }
          this.outboundBatchLoading = false
        }).catch(() => {
          this.outboundBatchLoading = false
        })
      }).catch(() => {})
    },
    confirmStep (fileType) {
      if (!this.dataForm.id) return
      this.confirmLoading = true
      this.currentConfirmType = fileType
      const beforeConfirm = fileType === 'OUTBOUND_RECEIPT' && this.dataForm.outboundReceipt
        ? this.saveOutboundReceipt({ silent: true, skipRefresh: true })
        : Promise.resolve(true)
      beforeConfirm.then(saved => {
        if (saved === false) {
          this.confirmLoading = false
          this.currentConfirmType = ''
          return
        }
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl('/erp/saleorder/confirm'),
          method: 'post',
          data: this.$http.adornData({
            saleOrderId: this.dataForm.id,
            fileType
          })
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('确认成功')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '确认失败')
          }
          this.confirmLoading = false
          this.currentConfirmType = ''
        }).catch(() => {
          this.confirmLoading = false
          this.currentConfirmType = ''
        })
      }).catch(() => {
        this.confirmLoading = false
        this.currentConfirmType = ''
      })
    },
    parseAmountValue (value) {
      const text = String(value == null ? '' : value).replace(/,/g, '').trim()
      const numberValue = Number(text)
      return Number.isFinite(numberValue) ? numberValue : 0
    },
    saveOutboundBatchBankSlip () {
      const batch = this.currentOutboundBatch
      if (!batch || !batch.id) return
      this.bankSlipSaving = true
      const payload = {
        id: batch.id,
        saleOrderId: this.dataForm.id,
        bankPayerNameModified: batch.bankPayerNameModified,
        bankPayeeNameModified: batch.bankPayeeNameModified,
        bankAmountModified: this.parseAmountValue(batch.bankAmountModified),
        bankPaymentDateModified: batch.bankPaymentDateModified,
        bankSerialNoModified: batch.bankSerialNoModified
      }
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/outbound/batch/bank-slip/save'),
        method: 'post',
        data: this.$http.adornData(payload)
      })).then(({ data }) => {
        if (data && data.code === 0) {
          const savedBatch = this.normalizeOutboundBatch(data.batch)
          const list = this.dataForm.outboundBatchList || []
          const index = list.findIndex(item => String(item.id) === String(savedBatch.id))
          if (index >= 0) {
            this.$set(this.dataForm.outboundBatchList, index, savedBatch)
          }
          this.$message.success('水单确认结果已保存')
          this.refreshDetail()
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '水单确认结果保存失败')
        }
      }).catch(() => {}).then(() => {
        this.bankSlipSaving = false
      })
    },
    openBankSlipDetail (batch) {
      this.bankSlipDetailBatch = batch ? Object.assign({}, batch) : null
      this.bankSlipDetailVisible = true
    },
    buildOutboundReceiptPayload () {
      if (!this.dataForm.id || !this.dataForm.outboundReceipt) return null
      return Object.assign({}, this.dataForm.outboundReceipt, {
        saleOrderId: this.dataForm.id,
        batchId: this.currentOutboundBatch ? this.currentOutboundBatch.id : (this.dataForm.outboundReceipt.batchId || null),
        itemList: (this.dataForm.outboundReceipt.itemList || []).map((item, index) => ({
          id: item.id,
          lineNo: index + 1,
          wmsOrderNo: item.wmsOrderNo,
          outboundOrderNo: item.outboundOrderNo,
          customerCode: item.customerCode,
          customerName: item.customerName,
          productId: item.productId || null,
          productCode: item.productCode,
          recognizedProductCode: item.recognizedProductCode,
          productName: item.productName,
          productNameEn: item.productNameEn,
          marketCirculationName: item.marketCirculationName,
          productSpec: item.productSpec,
          unit: item.unit,
          orderQty: item.orderQty,
          shippedQty: item.shippedQty,
          containerNo: item.containerNo,
          factoryNo: item.factoryNo,
          avgWeight: item.avgWeight,
          totalWeight: item.totalWeight
        }))
      })
    },
    validateOutboundReceiptRequiredItems () {
      const receipt = this.dataForm.outboundReceipt
      const items = (receipt && receipt.itemList) || []
      if (!items.length) return '出库回单明细不能为空'
      for (let index = 0; index < items.length; index++) {
        const item = items[index]
        if (!item.productId) return `第${index + 1}行系统编码不能为空`
        if (!item.shippedQty || Number(item.shippedQty) <= 0) return `第${index + 1}行实际箱数必须大于0`
        if (!item.totalWeight || Number(item.totalWeight) <= 0) return `第${index + 1}行实际重量必须大于0`
      }
      return ''
    },
    saveOutboundReceipt (options) {
      const opts = Object.assign({ silent: false, skipRefresh: false }, options || {})
      const receipt = this.buildOutboundReceiptPayload()
      if (!receipt) return Promise.resolve(false)
      const requiredError = this.validateOutboundReceiptRequiredItems()
      if (requiredError) {
        this.$message.error(requiredError)
        return Promise.resolve(false)
      }
      if (!opts.silent) {
        this.outboundSaveLoading = true
      }
      return this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl('/erp/saleorder/outbound/receipt/save'),
        method: 'post',
        data: this.$http.adornData(receipt)
      })).then(({ data }) => {
        if (data && data.code === 0) {
          this.dataForm.outboundReceipt = this.normalizeOutboundReceipt(data.receipt)
          if (!opts.silent) {
            this.$message.success('保存成功')
          }
          if (!opts.skipRefresh) {
            this.refreshDetail()
          }
          this.$emit('refreshDataList')
          return true
        } else {
          this.$message.error((data && data.msg) || '保存失败')
          return false
        }
      }).catch(() => {
        return false
      }).then(result => {
        if (!opts.silent) {
          this.outboundSaveLoading = false
        }
        return result
      }).catch(() => {
        if (!opts.silent) {
          this.outboundSaveLoading = false
        }
        return false
      })
    },
    openContract () {
      if (!this.dataForm.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      window.open(this.dataForm.contractUrl, '_blank')
    },
    contractPreviewUrl () {
      return String(this.dataForm.contractUrl || '').replace('/contract/', '/contract/pdf/preview/')
    },
    previewContractPdf () {
      if (!this.dataForm.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      window.open(this.contractPreviewUrl(), '_blank')
    },
    copyContractUrl () {
      if (!this.dataForm.contractUrl) {
        this.$message.error('合同链接不存在')
        return
      }
      const text = String(this.dataForm.contractUrl)
      const fallbackCopy = () => {
        const input = document.createElement('textarea')
        input.value = text
        input.setAttribute('readonly', 'readonly')
        input.style.position = 'fixed'
        input.style.top = '-9999px'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      const success = () => this.$message.success('链接已复制')
      const failure = () => this.$message.error('复制失败，请手动复制')
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(success).catch(() => {
          try {
            fallbackCopy()
            success()
          } catch (e) {
            failure()
          }
        })
        return
      }
      try {
        fallbackCopy()
        success()
      } catch (e) {
        failure()
      }
    },
    uploadFileChangeHandle (event) {
      const files = Array.from((event.target && event.target.files) || [])
      if (!files.length || !this.currentUploadType || !this.dataForm.id) return
      const formData = new FormData()
      formData.append('saleOrderId', this.dataForm.id)
      if (this.currentUploadType === 'OUTBOUND_RECEIPT' || this.currentUploadType === 'OUTBOUND_BATCH_BANK_SLIP') {
        if (!this.currentOutboundBatch) {
          this.$message.error('请先选择出库批次')
          return
        }
        formData.append('batchId', this.currentOutboundBatch.id)
      }
      if (this.currentUploadType !== 'OUTBOUND_RECEIPT' && this.currentUploadType !== 'OUTBOUND_BATCH_BANK_SLIP') {
        formData.append('fileType', this.currentUploadType)
      }
      files.forEach(file => formData.append('files', file))
      this.uploadLoading = true
      const url = this.currentUploadType === 'OUTBOUND_RECEIPT'
        ? '/erp/saleorder/outbound/receipt/recognize'
        : (this.currentUploadType === 'OUTBOUND_BATCH_BANK_SLIP' ? '/erp/saleorder/outbound/batch/bank-slip/upload' : '/erp/saleorder/upload')
      this.withGlobalLoading(this.$http({
        url: this.$http.adornUrl(url),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: this.currentUploadType === 'OUTBOUND_RECEIPT' ? 1000 * 180 : undefined
      })).then(({ data }) => {
        if (data && data.code === 0) {
          if (this.currentUploadType === 'OUTBOUND_RECEIPT') {
            this.dataForm.outboundReceipt = this.normalizeOutboundReceipt(data.receipt || this.dataForm.outboundReceipt)
          }
          if (this.currentUploadType === 'OUTBOUND_BATCH_BANK_SLIP' && data.batch) {
            this.activeOutboundBatchId = data.batch.id
          }
          this.$message.success('上传成功')
          this.refreshDetail()
          this.$emit('refreshDataList')
        } else {
          this.$message.error((data && data.msg) || '上传失败')
        }
        this.uploadLoading = false
      }).catch(() => {
        this.uploadLoading = false
      })
    },
    refreshDetail () {
      if (!this.dataForm.id) return Promise.resolve()
      this.detailLoading = true
      return this.withGlobalLoading(() => this.fetchDetail(this.dataForm.id)).finally(() => {
        this.detailLoading = false
        this.layoutOutboundTables()
      })
    },
    downloadFile (row) {
      if (!row.id) {
        this.$message.error('缺少文件ID')
        return
      }
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/saleorder/download/file/${row.id}?token=${encodeURIComponent(token)}`), '_blank')
    },
    downloadPickupDetail (batch) {
      if (!batch || !batch.id) {
        this.$message.error('缺少出库批次ID')
        return
      }
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/saleorder/outbound/batch/pickup-detail/${batch.id}?token=${encodeURIComponent(token)}`), '_blank')
    },
    previewFile (row) {
      if (!row.id) {
        this.$message.error('缺少文件ID')
        return
      }
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/saleorder/download/file/${row.id}?preview=1&token=${encodeURIComponent(token)}`), '_blank')
    },
    deleteFile (row) {
      if (!row || !row.id) return
      this.$confirm('确认删除这条上传记录？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.withGlobalLoading(this.$http({
          url: this.$http.adornUrl(`/erp/saleorder/delete/file/${row.id}`),
          method: 'post',
          data: this.$http.adornData({})
        })).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success('删除成功')
            this.refreshDetail()
            this.$emit('refreshDataList')
          } else {
            this.$message.error((data && data.msg) || '删除失败')
          }
        })
      }).catch(() => {})
    },
    formatDateOnly (value) {
      return value ? String(value).slice(0, 10) : ''
    },
    normalizeDateValue (value) {
      if (!value) return ''
      return String(value).slice(0, 10)
    },
    formatDateTime (value) {
      return value ? String(value).slice(0, 19).replace('T', ' ') : ''
    }
  }
}
</script>

<style scoped>
.sale-order-dialog {
  box-sizing: border-box;
  height: calc(94vh - 180px);
  max-height: calc(94vh - 180px);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px 28px 0;
  overscroll-behavior: contain;
}

.sale-order-dialog /deep/ .el-form-item {
  margin-bottom: 14px;
}

.sub-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 12px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.sub-title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-title-tip {
  color: #909399;
  font-size: 12px;
  font-weight: 400;
}

.item-table /deep/ .el-table__body-wrapper {
  max-height: 280px;
  overflow-y: auto;
}

.attachment-table /deep/ .el-table__body-wrapper {
  max-height: 220px;
  overflow-y: auto;
}

.allocation-table {
  margin-bottom: 12px;
}

.attachment-toolbar {
  margin-bottom: 8px;
}

.spot-search-title {
  justify-content: flex-start;
}

.spot-workflow-alert {
  margin: 8px 0 12px;
}

.spot-pricing-overview {
  display: grid;
  grid-template-columns: 1fr 1.6fr .7fr;
  gap: 10px;
  margin-bottom: 20px;
  padding: 14px;
  border: 1px solid #dbe7f3;
  border-radius: 6px;
  background: linear-gradient(135deg, #f7fbff 0%, #f2faf8 100%);
}

.spot-pricing-overview div {
  min-width: 0;
}

.spot-pricing-overview span,
.spot-pricing-overview strong {
  display: block;
}

.spot-pricing-overview span {
  margin-bottom: 5px;
  color: #8492a6;
  font-size: 12px;
}

.spot-pricing-overview strong {
  overflow: hidden;
  color: #26384a;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spot-pricing-tip {
  margin-top: 6px;
  color: #8492a6;
  font-size: 12px;
}

.spot-pricing-table-title {
  margin-bottom: 8px;
  color: #26384a;
  font-weight: 600;
}

.spot-pricing-detail-table {
  margin-bottom: 18px;
}

.spot-search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #dbe7f3;
  border-radius: 6px;
  background: linear-gradient(135deg, #f7fbff 0%, #f2faf8 100%);
}

.spot-contract-table {
  margin-top: 10px;
}

.spot-contract-table /deep/ .el-table__expanded-cell {
  padding: 12px 16px;
  background: #f8fafc;
}

.expired-stock-text {
  margin-right: 6px;
  color: #e23b3b;
  font-weight: 600;
}

.outbound-receipt-pane {
  display: flex;
  flex-direction: column;
}

.outbound-current-section-title,
.outbound-receipt-table,
.outbound-receipt-files-table,
.outbound-bank-files-table {
  order: 70;
}

.outbound-adjustment-summary,
.outbound-summary-table {
  order: 80;
}

.outbound-history-section-title,
.outbound-history-table {
  order: 90;
}

.outbound-flow-card {
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid #d9ecff;
  border-radius: 8px;
  background: linear-gradient(135deg, #f5fbff 0%, #ffffff 100%);
}

.outbound-flow-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.outbound-flow-header strong {
  margin-right: 10px;
  color: #1f6fbf;
  font-size: 15px;
}

.outbound-flow-tags {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.outbound-flow-steps {
  margin-bottom: 12px;
  background: transparent;
}

.outbound-flow-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed #d9ecff;
}

.outbound-open-batch-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
}

.outbound-open-batch-card {
  cursor: pointer;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  transition: border-color .2s, box-shadow .2s, background .2s;
}

.outbound-open-batch-card:hover,
.outbound-open-batch-card.is-active {
  border-color: #1f6fbf;
  background: #f4f9ff;
  box-shadow: 0 2px 10px rgba(31, 111, 191, .12);
}

.open-batch-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.open-batch-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  color: #606266;
  font-size: 12px;
}

.outbound-batch-info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 28px;
  margin: 8px 0 10px;
  padding: 10px 14px;
  border: 1px solid #d9ecff;
  border-radius: 4px;
  background: #f4f9ff;
  color: #606266;
}

.history-detail-label {
  margin: 8px 0 6px;
  color: #303133;
  font-weight: 600;
}

.outbound-receipt-actions {
  text-align: right;
  line-height: 36px;
}

.outbound-adjustment-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 2px 0 8px;
  color: #303133;
}

.outbound-adjustment-summary strong {
  font-size: 15px;
}

.outbound-section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 12px 0 8px;
  padding-left: 8px;
  border-left: 3px solid #1f6fbf;
  color: #303133;
}

.bank-slip-panel {
  margin: 8px 0 12px;
}

.bank-slip-card {
  min-height: 260px;
  padding: 12px 14px;
  border: 1px solid #dbe7f3;
  border-radius: 8px;
  background: #f8fbff;
}

.bank-slip-card-title {
  margin-bottom: 10px;
  font-weight: 600;
  color: #1f6fbf;
}

.bank-slip-diff {
  display: flex;
  gap: 18px;
  margin: 2px 0 6px;
  color: #606266;
}

.bank-slip-diff-warning {
  margin-bottom: 8px;
  color: #e23b3b;
  font-size: 12px;
  line-height: 18px;
}

.secondary-fee-panel {
  margin: 8px 0 12px;
}

.secondary-fee-cards {
  display: grid;
  grid-template-columns: repeat(5, minmax(120px, 1fr));
  gap: 10px;
}

.secondary-fee-card {
  padding: 10px 12px;
  border: 1px solid #dbe7f3;
  border-radius: 8px;
  background: #f8fbff;
}

.secondary-fee-card span {
  display: block;
  margin-bottom: 4px;
  color: #909399;
  font-size: 12px;
}

.secondary-fee-card strong {
  color: #303133;
  font-size: 16px;
}

.secondary-fee-card.total {
  border-color: #17b3a3;
  background: #f0fbf9;
}

.secondary-fee-help {
  margin-left: 4px;
  color: #409eff;
  cursor: help;
}

.secondary-fee-cell {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
}

.secondary-fee-popover {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.6;
  color: #303133;
  font-size: 13px;
}

.bank-slip-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #303133;
  font-weight: 600;
}

.bank-slip-detail-summary {
  display: flex;
  gap: 24px;
  margin: 12px 0 6px;
  color: #303133;
  font-weight: 600;
}

.bank-slip-detail-actions {
  margin-top: 10px;
  text-align: right;
}

.summary-tip {
  color: #909399;
  font-size: 12px;
}

.refund {
  color: #e23b3b;
}

.supplement {
  color: #0b8f72;
}

.pending-adjustment {
  color: #909399;
}

.contract-link-wrap {
  line-height: 32px;
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




