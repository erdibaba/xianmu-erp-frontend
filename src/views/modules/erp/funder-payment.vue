<template>
  <div class="mod-funder-payment">
    <el-form :inline="true" :model="queryForm">
      <el-form-item>
        <el-input
          v-model="queryForm.keyword"
          clearable
          placeholder="打款单号/付款主体/资方名称"
          @keyup.enter.native="getDataList()">
        </el-input>
      </el-form-item>
      <el-form-item>
        <el-select v-model="queryForm.paymentType" clearable placeholder="付款类型" style="width: 150px" @change="getDataList()">
          <el-option label="资方全款" :value="1"></el-option>
          <el-option label="内部主体全款" :value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getDataList()">查询</el-button>
        <el-button v-if="isAuth('erp:funderpayment:save')" type="success" @click="openCreate(1)">新增资方全款打款</el-button>
        <el-button v-if="isAuth('erp:funderpayment:save')" type="warning" @click="openCreate(2)">新增内部主体全款打款</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="dataList" border stripe v-loading="dataListLoading">
      <el-table-column prop="paymentNo" label="打款单号" min-width="190"></el-table-column>
      <el-table-column label="付款类型" width="110" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.paymentType === 2 ? 'warning' : 'success'" size="small">
            {{ paymentTypeName(scope.row.paymentType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="payerName" label="付款主体" min-width="210" show-overflow-tooltip></el-table-column>
      <el-table-column prop="funderName" label="资方" min-width="190" show-overflow-tooltip>
        <template slot-scope="scope">{{ scope.row.funderName || '-' }}</template>
      </el-table-column>
      <el-table-column prop="sellerContractNos" label="涉及合同号" min-width="230" show-overflow-tooltip>
        <template slot-scope="scope">{{ scope.row.sellerContractNos || '-' }}</template>
      </el-table-column>
      <el-table-column prop="paymentDate" label="打款日期" width="120" align="center"></el-table-column>
      <el-table-column label="确认金额" width="140" align="right">
        <template slot-scope="scope"><strong>{{ money(scope.row.modifiedAmount) }}</strong></template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === 0 ? 'warning' : 'success'" size="small">
            {{ paymentStatusName(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column fixed="right" label="操作" width="190" align="center">
        <template slot-scope="scope">
          <el-button
            v-if="isAuth('erp:funderpayment:save') && scope.row.paymentType === 2 && scope.row.status === 0"
            type="text"
            size="small"
            @click="openEditBalance(scope.row.id)">
            补尾款
          </el-button>
          <el-button type="text" size="small" @click="openDetail(scope.row.id)">详情</el-button>
          <el-button type="text" size="small" @click="previewVoucher(scope.row.id)">预览凭证</el-button>
          <el-button type="text" size="small" @click="downloadVoucher(scope.row.id, scope.row.fileName)">下载凭证</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      :current-page="pageIndex"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      :total="totalPage"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="sizeChangeHandle"
      @current-change="currentChangeHandle">
    </el-pagination>

    <el-dialog :title="createTitle" :visible.sync="createVisible" width="1050px" :close-on-click-modal="false">
      <el-form ref="paymentForm" :model="paymentForm" :rules="paymentRules" label-width="125px">
        <el-row :gutter="18">
          <el-col v-if="isFunderPayment" :span="12">
            <el-form-item label="资方" prop="funderId">
              <el-select
                v-model="paymentForm.funderId"
                filterable
                remote
                clearable
                :remote-method="searchFunders"
                :loading="funderLoading"
                placeholder="输入资方编码或名称搜索"
                style="width: 100%">
                <el-option v-for="item in funderOptions" :key="item.id" :label="item.partnerName" :value="item.id">
                  <span>{{ item.partnerName }}</span>
                  <span class="option-extra">{{ item.partnerCode }} / 年利率{{ rateLabel(item) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-else :span="12">
            <el-form-item label="实际付款主体" prop="actualPayerEntityId">
              <el-select
                v-model="paymentForm.actualPayerEntityId"
                filterable
                clearable
                :loading="internalPayerLoading"
                placeholder="请选择实际付款内部主体"
                style="width: 100%">
                <el-option v-for="item in internalPayerOptions" :key="item.id" :label="item.entityName" :value="item.id">
                  <span>{{ item.entityName }}</span>
                  <span class="option-extra">{{ item.entityCode }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-if="isFunderPayment" :span="12">
            <el-form-item label="打款日期" prop="paymentDate">
              <el-date-picker
                v-model="paymentForm.paymentDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择打款日期"
                style="width: 100%">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col v-if="isFunderPayment" :span="12">
            <el-form-item label="修改金额" prop="modifiedAmount">
              <el-input-number
                v-model="paymentForm.modifiedAmount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 100%"
                @change="recalculateLastAllocation">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col v-if="isFunderPayment" :span="24">
            <el-form-item label="打款凭证" prop="filePath">
              <el-upload action="#" :show-file-list="false" :http-request="recognizePaymentVoucher" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button type="primary" plain :loading="recognizeLoading">上传并识别凭证</el-button>
              </el-upload>
              <span class="file-name">{{ paymentForm.fileName || '尚未上传' }}</span>
              <div class="bank-voucher-tip">{{ bankVoucherSupportTip }}</div>
            </el-form-item>
          </el-col>
          <el-col v-if="isFunderPayment" :span="24">
            <el-form-item label="合同归档">
              <el-upload action="#" :show-file-list="false" :http-request="uploadPaymentContract" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf,.doc,.docx,.xls,.xlsx">
                <el-button type="primary" plain :loading="contractUploadLoading">上传合同存档</el-button>
              </el-upload>
              <span class="file-name">{{ paymentForm.contractFileName || '尚未上传' }}</span>
              <div class="bank-voucher-tip">仅用于原件存档，暂不做OCR识别。</div>
            </el-form-item>
          </el-col>
          <el-col v-if="isFunderPayment" :span="24">
            <el-form-item label="选择确认函" prop="selectedConfirmIds">
              <el-select
                v-model="paymentForm.selectedConfirmIds"
                multiple
                filterable
                remote
                :remote-method="searchPresales"
                :loading="presaleLoading"
                placeholder="输入确认函合同号、柜号或采购方搜索，最多返回15条"
                style="width: 100%"
                @change="presaleSelectionChange">
                <el-option v-for="item in presaleOptions" :key="confirmOptionId(item)" :label="presaleLabel(item)" :value="confirmOptionId(item)"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col v-else :span="24">
            <el-form-item label="选择确认函" prop="selectedConfirmId">
              <el-select
                v-model="paymentForm.selectedConfirmId"
                filterable
                remote
                clearable
                :disabled="!!paymentForm.id"
                :remote-method="searchPresales"
                :loading="presaleLoading"
                placeholder="输入确认函合同号、柜号或采购方搜索，最多返回15条"
                style="width: 100%"
                @change="xianmuPresaleChange">
                <el-option v-for="item in presaleOptions" :key="confirmOptionId(item)" :label="presaleLabel(item)" :value="confirmOptionId(item)"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <template v-if="isFunderPayment">
        <div class="section-title">确认函金额分摊</div>
        <el-table :data="paymentForm.allocationList" border height="360">
          <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
          <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="170"></el-table-column>
          <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="160"></el-table-column>
          <el-table-column label="最迟提货日" width="180">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.latestPickupDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="必填"
                style="width: 155px">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column prop="customerReference" label="采购方" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column label="订单合同金额" width="160" align="right">
            <template slot-scope="scope">{{ money(scope.row.orderContractAmount) }}</template>
          </el-table-column>
          <el-table-column label="分摊打款金额" width="190">
            <template slot-scope="scope">
              <el-input
                :value="scope.row.allocationAmount"
                inputmode="decimal"
                placeholder="支持粘贴1,234.56"
                style="width: 160px"
                @input="allocationAmountInput(scope.$index, $event)"
                @blur="allocationAmountBlur(scope.$index)">
              </el-input>
            </template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="鲜牧是否出资" width="135">
            <template slot-scope="scope">
              <el-select
                v-model="scope.row.xianmuContributionFlag"
                style="width: 105px"
                @change="xianmuContributionFlagChange(scope.row)">
                <el-option label="出资" :value="1"></el-option>
                <el-option label="不出资" :value="0"></el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="业务主体出资款凭证" width="190">
            <template slot-scope="scope">
              <template v-if="hasXianmuContribution(scope.row)">
                <el-upload
                  action="#"
                  :show-file-list="false"
                  :http-request="request => recognizeXianmuContribution(request, scope.$index)"
                  accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                  <el-button
                    type="primary"
                    plain
                    size="mini"
                    :loading="xianmuContributionLoadingIndex === scope.$index">
                    上传并识别
                  </el-button>
                </el-upload>
                <div class="row-file-name">{{ scope.row.xianmuContributionFileName || '未上传' }}</div>
                <div class="row-support-tip">支持浦发/建行/工行/兴业/农发行样本</div>
              </template>
              <span v-else class="row-support-tip">鲜牧不出资，无需上传</span>
            </template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="出资识别金额" width="150" align="right">
            <template slot-scope="scope">{{ hasXianmuContribution(scope.row) ? money(scope.row.xianmuContributionRecognizedAmount) : '-' }}</template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="出资确认金额" width="160">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.xianmuContributionModifiedAmount"
                :min="0"
                :precision="2"
                :controls="false"
                :disabled="!hasXianmuContribution(scope.row)"
                style="width: 135px">
              </el-input-number>
            </template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="出资日期" width="180">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.xianmuContributionDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择日期"
                :disabled="!hasXianmuContribution(scope.row)"
                style="width: 155px">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column v-if="isFunderPayment" label="贷款本金" width="130" align="right">
            <template slot-scope="scope">{{ money(loanPrincipal(scope.row)) }}</template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="定金凭证" width="180">
            <template slot-scope="scope">
              <el-upload
                action="#"
                :show-file-list="false"
                :http-request="request => recognizeXianmuInstallment(request, scope.$index, 'deposit')"
                accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button
                  type="primary"
                  plain
                  size="mini"
                  :loading="xianmuInstallmentLoadingKey === installmentLoadingKey(scope.$index, 'deposit')">
                  上传定金
                </el-button>
              </el-upload>
              <div class="row-file-name">{{ scope.row.xianmuDepositFileName || '未上传' }}</div>
              <div class="row-support-tip">支持浦发/建行/工行/兴业/农发行样本</div>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="定金金额" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.xianmuDepositModifiedAmount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 125px">
              </el-input-number>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="定金日期" width="145">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.xianmuDepositDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择日期"
                style="width: 120px">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="尾款/全款凭证" width="180">
            <template slot-scope="scope">
              <el-upload
                action="#"
                :show-file-list="false"
                :http-request="request => recognizeXianmuInstallment(request, scope.$index, 'balance')"
                accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                <el-button
                  type="warning"
                  plain
                  size="mini"
                  :loading="xianmuInstallmentLoadingKey === installmentLoadingKey(scope.$index, 'balance')">
                  上传尾款/全款
                </el-button>
              </el-upload>
              <div class="row-file-name">{{ scope.row.xianmuBalanceFileName || '未上传' }}</div>
              <div class="row-support-tip">支持浦发/建行/工行/兴业/农发行样本</div>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="尾款/全款金额" width="150">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.xianmuBalanceModifiedAmount"
                :min="0"
                :precision="2"
                :controls="false"
                style="width: 125px">
              </el-input-number>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="尾款/全款日期" width="145">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.xianmuBalanceDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="选择日期"
                style="width: 120px">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="已付合计" width="130" align="right">
            <template slot-scope="scope">{{ money(xianmuPaidAmount(scope.row)) }}</template>
          </el-table-column>
          <el-table-column v-if="!isFunderPayment" label="待付金额" width="130" align="right">
            <template slot-scope="scope">{{ money(xianmuRemainAmount(scope.row)) }}</template>
          </el-table-column>
        </el-table>
        <div class="allocation-summary">
          <strong>分摊合计：{{ money(allocationTotal) }}</strong>
          <span :class="allocationMatched ? 'matched' : 'mismatch'">{{ allocationMessage }}</span>
        </div>
        </template>
        <div v-else class="xianmu-single-payment">
          <div class="section-title">内部主体全款打款</div>
          <el-alert
            v-if="!xianmuAllocation.confirmId"
            type="info"
            title="请先选择一张客户订单确认函"
            :closable="false">
          </el-alert>
          <template v-else>
            <el-descriptions :column="3" border size="small" class="xianmu-summary">
              <el-descriptions-item label="预销售单号">{{ xianmuAllocation.presaleOrderNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="确认函合同号">{{ xianmuAllocation.confirmContractNo || '-' }}</el-descriptions-item>
              <el-descriptions-item label="采购方">{{ xianmuAllocation.customerReference || '-' }}</el-descriptions-item>
              <el-descriptions-item label="确认函总金额">{{ money(xianmuAllocation.allocationAmount) }}</el-descriptions-item>
              <el-descriptions-item label="已付合计">{{ money(xianmuPaidAmount(xianmuAllocation)) }}</el-descriptions-item>
              <el-descriptions-item label="待付金额">{{ money(xianmuRemainAmount(xianmuAllocation)) }}</el-descriptions-item>
            </el-descriptions>
            <el-row :gutter="18" class="installment-row">
              <el-col :span="12">
                <el-card shadow="never">
                  <div slot="header"><strong>定金凭证</strong></div>
                  <el-form-item label="定金凭证">
                    <el-upload action="#" :show-file-list="false" :http-request="request => recognizeXianmuInstallment(request, 0, 'deposit')" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                      <el-button type="primary" plain :loading="xianmuInstallmentLoadingKey === installmentLoadingKey(0, 'deposit')">上传并识别定金</el-button>
                    </el-upload>
                    <span class="file-name">{{ xianmuAllocation.xianmuDepositFileName || '未上传' }}</span>
                    <div class="bank-voucher-tip">{{ bankVoucherSupportTip }}</div>
                  </el-form-item>
                  <el-form-item label="定金金额">
                    <el-input-number v-model="xianmuAllocation.xianmuDepositModifiedAmount" :min="0" :precision="2" :controls="false" style="width: 100%"></el-input-number>
                  </el-form-item>
                  <el-form-item label="定金日期">
                    <el-date-picker v-model="xianmuAllocation.xianmuDepositDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 100%"></el-date-picker>
                  </el-form-item>
                </el-card>
              </el-col>
              <el-col :span="12">
                <el-card shadow="never">
                  <div slot="header"><strong>尾款/全款凭证</strong></div>
                  <el-form-item label="尾款/全款凭证">
                    <el-upload action="#" :show-file-list="false" :http-request="request => recognizeXianmuInstallment(request, 0, 'balance')" accept=".jpg,.jpeg,.png,.jfif,.bmp,.pdf">
                      <el-button type="warning" plain :loading="xianmuInstallmentLoadingKey === installmentLoadingKey(0, 'balance')">上传并识别尾款/全款</el-button>
                    </el-upload>
                    <span class="file-name">{{ xianmuAllocation.xianmuBalanceFileName || '未上传' }}</span>
                    <div class="bank-voucher-tip">{{ bankVoucherSupportTip }}</div>
                  </el-form-item>
                  <el-form-item label="尾款/全款金额">
                    <el-input-number v-model="xianmuAllocation.xianmuBalanceModifiedAmount" :min="0" :precision="2" :controls="false" style="width: 100%"></el-input-number>
                  </el-form-item>
                  <el-form-item label="尾款/全款日期">
                    <el-date-picker v-model="xianmuAllocation.xianmuBalanceDate" type="date" value-format="yyyy-MM-dd" placeholder="选择日期" style="width: 100%"></el-date-picker>
                  </el-form-item>
                </el-card>
              </el-col>
            </el-row>
          </template>
        </div>
      </el-form>
      <span slot="footer">
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="confirmPayment()">{{ confirmButtonText }}</el-button>
      </span>
    </el-dialog>

    <el-dialog title="预销售单打款详情" :visible.sync="detailVisible" width="950px">
      <el-descriptions v-if="detailData.id" :column="3" border>
        <el-descriptions-item label="打款单号">{{ detailData.paymentNo }}</el-descriptions-item>
        <el-descriptions-item label="付款类型">{{ paymentTypeName(detailData.paymentType) }}</el-descriptions-item>
        <el-descriptions-item label="付款主体">{{ detailData.payerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资方">{{ detailData.funderName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="打款日期">{{ detailData.paymentDate }}</el-descriptions-item>
        <el-descriptions-item label="确认金额">{{ money(detailData.modifiedAmount) }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ paymentStatusName(detailData.status) }}</el-descriptions-item>
        <el-descriptions-item label="归档原件">
          <el-button type="text" @click="previewVoucher(detailData.id)">预览凭证</el-button>
          <el-button type="text" @click="downloadVoucher(detailData.id, detailData.fileName)">下载凭证</el-button>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.paymentType === 1" label="合同归档">
          <template v-if="detailData.contractFileName">
            <el-button type="text" @click="previewContract(detailData.id)">预览合同</el-button>
            <el-button type="text" @click="downloadContract(detailData.id, detailData.contractFileName)">下载合同</el-button>
          </template>
          <span v-else>-</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-table :data="detailData.allocationList || []" border style="margin-top: 16px">
        <el-table-column type="index" label="序号" width="60" align="center"></el-table-column>
        <el-table-column prop="presaleOrderNo" label="预销售单号" min-width="180"></el-table-column>
        <el-table-column prop="confirmContractNo" label="确认函合同号" min-width="180"></el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" prop="latestPickupDate" label="最迟提货日" width="120" align="center"></el-table-column>
        <el-table-column label="订单合同金额" width="160" align="right">
          <template slot-scope="scope">{{ money(detailOrderContractAmount(scope.row)) }}</template>
        </el-table-column>
        <el-table-column label="分摊打款金额" width="180" align="right">
          <template slot-scope="scope">{{ money(scope.row.allocationAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="鲜牧是否出资" width="120" align="center">
          <template slot-scope="scope">{{ hasXianmuContribution(scope.row) ? '出资' : '不出资' }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="出资识别金额" width="150" align="right">
          <template slot-scope="scope">{{ money(scope.row.xianmuContributionRecognizedAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="业务主体出资款" width="150" align="right">
          <template slot-scope="scope">{{ money(scope.row.xianmuContributionModifiedAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="出资日期" width="120" align="center">
          <template slot-scope="scope">{{ scope.row.xianmuContributionDate || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="贷款本金" width="150" align="right">
          <template slot-scope="scope">{{ money(loanPrincipal(scope.row)) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 1" label="出资凭证" width="120" align="center">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.xianmuContributionFileName"
              type="text"
              size="small"
              @click="previewContributionVoucher(scope.row.id)">
              预览
            </el-button>
            <el-button
              v-if="scope.row.xianmuContributionFileName"
              type="text"
              size="small"
              @click="downloadContributionVoucher(scope.row.id, scope.row.xianmuContributionFileName)">
              下载
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 2" label="定金" width="130" align="right">
          <template slot-scope="scope">{{ money(scope.row.xianmuDepositModifiedAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 2" label="定金日期" width="120" align="center">
          <template slot-scope="scope">{{ scope.row.xianmuDepositDate || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 2" label="尾款" width="130" align="right">
          <template slot-scope="scope">{{ money(scope.row.xianmuBalanceModifiedAmount) }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 2" label="尾款日期" width="120" align="center">
          <template slot-scope="scope">{{ scope.row.xianmuBalanceDate || '-' }}</template>
        </el-table-column>
        <el-table-column v-if="detailData.paymentType === 2" label="待付金额" width="130" align="right">
          <template slot-scope="scope">{{ money(xianmuRemainAmount(scope.row)) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
const PAYMENT_TYPE_FUNDER = 1
const PAYMENT_TYPE_XIANMU = 2

const emptyPayment = (paymentType = PAYMENT_TYPE_FUNDER) => ({
  id: null,
  paymentType,
  payerId: null,
  actualPayerEntityId: null,
  actualPayerEntityName: '',
  funderId: null,
  recognizedAmount: 0,
  modifiedAmount: 0,
  paymentDate: '',
  filePath: '',
  fileName: '',
  contractFilePath: '',
  contractFileName: '',
  rawText: '',
  recognizedReceipt: {},
  selectedConfirmId: null,
  selectedConfirmIds: [],
  allocationList: []
})

export default {
  data () {
    return {
      queryForm: { keyword: '', paymentType: '' },
      dataList: [],
      pageIndex: 1,
      pageSize: 10,
      totalPage: 0,
      dataListLoading: false,
      createVisible: false,
      detailVisible: false,
      detailData: {},
      paymentForm: emptyPayment(),
      bankVoucherSupportTip: '支持浦发银行、建设银行、工商银行、兴业银行、农发行电子回单样本，支持 PDF / JPG / PNG，识别后请核对金额和日期。',
      funderOptions: [],
      internalPayerOptions: [],
      presaleOptions: [],
      funderLoading: false,
      internalPayerLoading: false,
      presaleLoading: false,
      recognizeLoading: false,
      contractUploadLoading: false,
      xianmuContributionLoadingIndex: -1,
      xianmuInstallmentLoadingKey: '',
      submitLoading: false,
      paymentRules: {
        funderId: [{ required: true, message: '请选择资方', trigger: 'change' }],
        actualPayerEntityId: [{ required: true, message: '请选择实际付款内部主体', trigger: 'change' }],
        paymentDate: [{ required: true, message: '请选择打款日期', trigger: 'change' }],
        modifiedAmount: [{ required: true, message: '请输入修改金额', trigger: 'blur' }],
        filePath: [{ required: true, message: '请上传打款凭证', trigger: 'change' }],
        selectedConfirmId: [{ required: true, message: '请选择一张确认函', trigger: 'change' }],
        selectedConfirmIds: [{ type: 'array', required: true, min: 1, message: '请至少选择一张确认函', trigger: 'change' }]
      }
    }
  },
  computed: {
    isFunderPayment () {
      return this.paymentForm.paymentType === PAYMENT_TYPE_FUNDER
    },
    createTitle () {
      if (this.paymentForm.id) return '补上传内部主体全款尾款'
      return this.isFunderPayment ? '新增资方全款打款' : '新增内部主体全款打款'
    },
    confirmButtonText () {
      if (this.paymentForm.id) return '保存尾款并更新状态'
      return this.isFunderPayment ? '确认打款并生成贷款' : '确认内部主体全款打款'
    },
    allocationTotal () {
      return (this.paymentForm.allocationList || []).reduce((sum, item) => sum + Number(item.allocationAmount || 0), 0)
    },
    xianmuAllocation () {
      return (this.paymentForm.allocationList && this.paymentForm.allocationList[0]) || {}
    },
    allocationMatched () {
      return Math.round(this.allocationTotal * 100) === Math.round(Number(this.paymentForm.modifiedAmount || 0) * 100)
    },
    previousAllocationTotal () {
      const rows = this.paymentForm.allocationList || []
      return rows.slice(0, -1).reduce((sum, item) => sum + Number(item.allocationAmount || 0), 0)
    },
    allocationExceeded () {
      return Math.round(this.previousAllocationTotal * 100) > Math.round(Number(this.paymentForm.modifiedAmount || 0) * 100)
    },
    allocationMessage () {
      if (this.allocationExceeded) return '前面行分摊金额合计已超过修改金额，请核对'
      return this.allocationMatched ? '与修改金额一致' : '分摊合计必须与修改金额完全一致'
    }
  },
  activated () {
    this.getDataList()
  },
  methods: {
    money (value) {
      return Number(value || 0).toFixed(2)
    },
    roundMoney (value) {
      return Math.round(Number(value || 0) * 100) / 100
    },
    detailOrderContractAmount (row) {
      return row && row.orderContractAmount !== undefined && row.orderContractAmount !== null
        ? row.orderContractAmount
        : (row ? row.allocationAmount : 0)
    },
    loanPrincipal (row) {
      const contributionAmount = this.hasXianmuContribution(row) ? Number(row.xianmuContributionModifiedAmount || 0) : 0
      return this.roundMoney(Number(row.allocationAmount || 0) - contributionAmount)
    },
    hasXianmuContribution (row) {
      return !row || row.xianmuContributionFlag === undefined || row.xianmuContributionFlag === null || Number(row.xianmuContributionFlag) !== 0
    },
    xianmuContributionFlagChange (row) {
      if (this.hasXianmuContribution(row)) return
      this.$set(row, 'xianmuContributionRecognizedAmount', 0)
      this.$set(row, 'xianmuContributionModifiedAmount', 0)
      this.$set(row, 'xianmuContributionDate', '')
      this.$set(row, 'xianmuContributionFilePath', '')
      this.$set(row, 'xianmuContributionFileName', '')
      this.$set(row, 'xianmuContributionRawText', '')
    },
    paymentTypeName (value) {
      return Number(value || PAYMENT_TYPE_FUNDER) === PAYMENT_TYPE_XIANMU ? '内部主体全款' : '资方全款'
    },
    paymentStatusName (value) {
      return Number(value || 0) === 0 ? '待尾款' : '已确认'
    },
    confirmOptionId (item) {
      return item && item.confirmInfo ? item.confirmInfo.id : null
    },
    installmentLoadingKey (index, kind) {
      return `${index}-${kind}`
    },
    xianmuPaidAmount (row) {
      return this.roundMoney(Number(row.xianmuDepositModifiedAmount || 0) + Number(row.xianmuBalanceModifiedAmount || 0))
    },
    xianmuRemainAmount (row) {
      return Math.max(0, this.roundMoney(Number(row.allocationAmount || 0) - this.xianmuPaidAmount(row)))
    },
    xianmuExpectedBalanceAmount (row) {
      return Math.max(0, this.roundMoney(Number(row.allocationAmount || 0) - Number(row.xianmuDepositModifiedAmount || 0)))
    },
    rateLabel (item) {
      return item.annualInterestRate === null || item.annualInterestRate === undefined ? '未维护' : item.annualInterestRate + '%'
    },
    presaleLabel (item) {
      const confirm = (item && item.confirmInfo) || {}
      return `${item.orderNo || '-'} / ${confirm.contractNo || '无确认函合同号'} / ${confirm.containerNo || '无柜号'} / ${item.customerReference || confirm.buyerPartnerName || '无采购方'}`
    },
    getDataList () {
      this.dataListLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/payment/list'),
        method: 'get',
        params: this.$http.adornParams({
          page: this.pageIndex,
          limit: this.pageSize,
          keyword: this.queryForm.keyword,
          paymentType: this.queryForm.paymentType || undefined
        })
      }).then(({ data }) => {
        this.dataListLoading = false
        if (data && data.code === 0) {
          this.dataList = data.page.list || []
          this.totalPage = data.page.totalCount || 0
        } else {
          this.$message.error((data && data.msg) || '获取预销售单打款列表失败')
        }
      }).catch(() => { this.dataListLoading = false })
    },
    sizeChangeHandle (value) {
      this.pageSize = value
      this.pageIndex = 1
      this.getDataList()
    },
    currentChangeHandle (value) {
      this.pageIndex = value
      this.getDataList()
    },
    openCreate (paymentType) {
      this.paymentForm = emptyPayment(paymentType)
      this.funderOptions = []
      this.internalPayerOptions = []
      this.presaleOptions = []
      this.createVisible = true
      if (this.isFunderPayment) {
        this.searchFunders('')
      } else {
        this.searchInternalPayers('', true)
      }
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
    searchInternalPayers (keyword, setDefault = false) {
      this.internalPayerLoading = true
      this.$http({
        url: this.$http.adornUrl('/erp/internalentity/select'),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        this.internalPayerLoading = false
        this.internalPayerOptions = (data && data.list) || []
        if (setDefault && !this.paymentForm.actualPayerEntityId && this.internalPayerOptions.length) {
          const defaultEntity = this.internalPayerOptions.find(item => Number(item.defaultFlag || 0) === 1)
          this.paymentForm.actualPayerEntityId = (defaultEntity || this.internalPayerOptions[0]).id
        }
      }).catch(() => { this.internalPayerLoading = false })
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
          customerReference: row.customerReference,
          confirmInfo: {
            id: row.confirmId,
            contractNo: row.confirmContractNo,
            totalAmount: row.orderContractAmount
          }
        }))
        const result = (data && data.list) || []
        this.presaleOptions = selectedRows.concat(result.filter(item => !selectedRows.some(selected => this.confirmOptionId(selected) === this.confirmOptionId(item))))
      }).catch(() => { this.presaleLoading = false })
    },
    presaleSelectionChange (ids) {
      const oldRows = this.paymentForm.allocationList || []
      this.paymentForm.allocationList = ids.map(confirmId => {
        const old = oldRows.find(item => item.confirmId === confirmId)
        if (old) return old
        const option = this.presaleOptions.find(item => this.confirmOptionId(item) === confirmId) || {}
        const confirm = option.confirmInfo || {}
        const confirmAmount = Number(option.confirmInfo && option.confirmInfo.totalAmount ? option.confirmInfo.totalAmount : 0)
        return {
          presaleOrderId: option.id,
          confirmId: confirmId,
          presaleOrderNo: option.orderNo,
          sellerContractNo: option.sellerContractNo,
          confirmContractNo: confirm.contractNo,
          latestPickupDate: '',
          customerReference: option.customerReference || confirm.buyerPartnerName,
          orderContractAmount: this.roundMoney(confirmAmount),
          allocationAmount: this.roundMoney(confirmAmount),
          xianmuContributionFlag: 1,
          xianmuContributionRecognizedAmount: 0,
          xianmuContributionModifiedAmount: 0,
          xianmuContributionDate: '',
          xianmuContributionFilePath: '',
          xianmuContributionFileName: '',
          xianmuContributionRawText: '',
          xianmuDepositRecognizedAmount: 0,
          xianmuDepositModifiedAmount: 0,
          xianmuDepositDate: '',
          xianmuDepositFilePath: '',
          xianmuDepositFileName: '',
          xianmuDepositRawText: '',
          xianmuBalanceRecognizedAmount: 0,
          xianmuBalanceModifiedAmount: 0,
          xianmuBalanceDate: '',
          xianmuBalanceFilePath: '',
          xianmuBalanceFileName: '',
          xianmuBalanceRawText: ''
        }
      })
    },
    xianmuPresaleChange (id) {
      if (!id) {
        this.paymentForm.allocationList = []
        return
      }
      const option = this.presaleOptions.find(item => this.confirmOptionId(item) === id) || {}
      const confirm = option.confirmInfo || {}
      const confirmAmount = Number(option.confirmInfo && option.confirmInfo.totalAmount ? option.confirmInfo.totalAmount : 0)
      if (confirmAmount <= 0) {
        this.$message.error('所选确认函总金额为空，不能进行内部主体全款打款')
        this.paymentForm.selectedConfirmId = null
        this.paymentForm.allocationList = []
        return
      }
      this.paymentForm.modifiedAmount = this.roundMoney(confirmAmount)
      this.paymentForm.allocationList = [{
        presaleOrderId: option.id,
        confirmId: id,
        presaleOrderNo: option.orderNo,
        sellerContractNo: option.sellerContractNo,
        confirmContractNo: confirm.contractNo,
        latestPickupDate: '',
        customerReference: option.customerReference || confirm.buyerPartnerName,
        orderContractAmount: this.roundMoney(confirmAmount),
        allocationAmount: this.roundMoney(confirmAmount),
        xianmuDepositRecognizedAmount: 0,
        xianmuDepositModifiedAmount: 0,
        xianmuDepositDate: '',
        xianmuDepositFilePath: '',
        xianmuDepositFileName: '',
        xianmuDepositRawText: '',
        xianmuBalanceRecognizedAmount: 0,
        xianmuBalanceModifiedAmount: 0,
        xianmuBalanceDate: '',
        xianmuBalanceFilePath: '',
        xianmuBalanceFileName: '',
        xianmuBalanceRawText: ''
      }]
    },
    allocationAmountInput (index, value) {
      const rows = this.paymentForm.allocationList || []
      if (!rows[index]) return
      let normalized = String(value === null || value === undefined ? '' : value)
        .replace(/[,，]/g, '')
        .replace(/[^\d.]/g, '')
      const decimalIndex = normalized.indexOf('.')
      if (decimalIndex >= 0) {
        normalized = normalized.substring(0, decimalIndex + 1) +
          normalized.substring(decimalIndex + 1).replace(/\./g, '').substring(0, 2)
      }
      this.$set(rows[index], 'allocationAmount', normalized)
    },
    allocationAmountBlur (index) {
      const rows = this.paymentForm.allocationList || []
      if (!rows[index]) return
      const value = rows[index].allocationAmount
      this.$set(rows[index], 'allocationAmount', value === '' ? '' : this.roundMoney(value))
    },
    recalculateLastAllocation () {
      const rows = this.paymentForm.allocationList || []
      if (!rows.length) return
      const remainder = this.roundMoney(Number(this.paymentForm.modifiedAmount || 0) - this.previousAllocationTotal)
      this.$set(rows[rows.length - 1], 'allocationAmount', Math.max(0, remainder))
    },
    recognizePaymentVoucher (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.recognizeLoading = true
      const loading = this.$loading({ lock: true, text: '正在识别并归档打款凭证...' })
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
          this.paymentForm.recognizedReceipt = voucher
          this.$nextTick(() => this.recalculateLastAllocation())
          this.$message.success('凭证识别完成，请核对金额和日期')
        } else {
          this.$message.error((data && data.msg) || '凭证识别失败')
        }
      }).catch(() => this.$message.error('凭证识别请求失败')).finally(() => {
        this.recognizeLoading = false
        loading.close()
      })
    },
    uploadPaymentContract (request) {
      const formData = new FormData()
      formData.append('file', request.file)
      this.contractUploadLoading = true
      const loading = this.$loading({ lock: true, text: '正在上传并归档合同...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/contract/upload'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const contract = data.contract || {}
          this.paymentForm.contractFilePath = contract.filePath || ''
          this.paymentForm.contractFileName = contract.fileName || request.file.name
          this.$message.success('合同已归档')
        } else {
          this.$message.error((data && data.msg) || '合同归档失败')
        }
      }).catch(() => this.$message.error('合同归档请求失败')).finally(() => {
        this.contractUploadLoading = false
        loading.close()
      })
    },
    recognizeXianmuContribution (request, index) {
      const rows = this.paymentForm.allocationList || []
      if (!rows[index]) return
      const formData = new FormData()
      formData.append('file', request.file)
      this.xianmuContributionLoadingIndex = index
      const loading = this.$loading({ lock: true, text: '正在识别并归档业务主体出资款凭证...' })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          const row = rows[index]
          this.$set(row, 'xianmuContributionRecognizedAmount', Number(voucher.recognizedAmount || 0))
          this.$set(row, 'xianmuContributionModifiedAmount', Number(voucher.recognizedAmount || 0))
          this.$set(row, 'xianmuContributionDate', voucher.paymentDate || '')
          this.$set(row, 'xianmuContributionFilePath', voucher.filePath || '')
          this.$set(row, 'xianmuContributionFileName', voucher.fileName || request.file.name)
          this.$set(row, 'xianmuContributionRawText', voucher.rawText || '')
          this.$message.success('业务主体出资款凭证识别完成，请核对金额和日期')
        } else {
          this.$message.error((data && data.msg) || '业务主体出资款凭证识别失败')
        }
      }).catch(() => this.$message.error('业务主体出资款凭证识别请求失败')).finally(() => {
        this.xianmuContributionLoadingIndex = -1
        loading.close()
      })
    },
    recognizeXianmuInstallment (request, index, kind) {
      const rows = this.paymentForm.allocationList || []
      if (!rows[index]) return
      const formData = new FormData()
      formData.append('file', request.file)
      const loadingKey = this.installmentLoadingKey(index, kind)
      const name = kind === 'deposit' ? '定金' : '尾款'
      this.xianmuInstallmentLoadingKey = loadingKey
      const loading = this.$loading({ lock: true, text: `正在识别并归档内部主体全款${name}凭证...` })
      this.$http({
        url: this.$http.adornUrl('/erp/funder-finance/voucher/recognize'),
        method: 'post',
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const voucher = data.voucher || {}
          const row = rows[index]
          const prefix = kind === 'deposit' ? 'xianmuDeposit' : 'xianmuBalance'
          this.$set(row, `${prefix}RecognizedAmount`, Number(voucher.recognizedAmount || 0))
          this.$set(row, `${prefix}ModifiedAmount`, Number(voucher.recognizedAmount || 0))
          this.$set(row, `${prefix}Date`, voucher.paymentDate || '')
          this.$set(row, `${prefix}FilePath`, voucher.filePath || '')
          this.$set(row, `${prefix}FileName`, voucher.fileName || request.file.name)
          this.$set(row, `${prefix}RawText`, voucher.rawText || '')
          this.$message.success(`内部主体全款${name}凭证识别完成，请核对金额和日期`)
        } else {
          this.$message.error((data && data.msg) || `内部主体全款${name}凭证识别失败`)
        }
      }).catch(() => this.$message.error(`内部主体全款${name}凭证识别请求失败`)).finally(() => {
        this.xianmuInstallmentLoadingKey = ''
        loading.close()
      })
    },
    prepareXianmuPaymentForm () {
      const rows = this.paymentForm.allocationList || []
      if (!rows.length) {
        this.$message.error('请至少选择一张预销售单')
        return false
      }
      let recognizedTotal = 0
      let latestDate = ''
      let firstFilePath = ''
      let firstFileName = ''
      for (let index = 0; index < rows.length; index++) {
        const row = rows[index]
        const allocationAmount = Number(row.allocationAmount || 0)
        const depositAmount = Number(row.xianmuDepositModifiedAmount || 0)
        const balanceAmount = Number(row.xianmuBalanceModifiedAmount || 0)
        const expectedBalanceAmount = this.xianmuExpectedBalanceAmount(row)
        const hasDeposit = !!row.xianmuDepositFilePath || !!row.xianmuDepositDate || depositAmount > 0
        const hasBalance = !!row.xianmuBalanceFilePath || !!row.xianmuBalanceDate || balanceAmount > 0
        if (!hasDeposit && !hasBalance) {
          this.$message.error(`第${index + 1}行必须上传定金凭证或全款/尾款凭证`)
          return false
        }
        if (hasDeposit && (!row.xianmuDepositFilePath || !row.xianmuDepositDate || depositAmount <= 0)) {
          this.$message.error(`第${index + 1}行已填写定金时，定金凭证、日期和金额都必须完整`)
          return false
        }
        if (hasDeposit && this.roundMoney(depositAmount) > this.roundMoney(allocationAmount)) {
          this.$message.error(`第${index + 1}行定金金额不能大于客户订单确认函总金额`)
          return false
        }
        if (hasDeposit && hasBalance && expectedBalanceAmount <= 0) {
          this.$message.error(`第${index + 1}行定金已覆盖客户订单确认函总金额，无需再上传尾款`)
          return false
        }
        if (hasBalance && (!row.xianmuBalanceFilePath || !row.xianmuBalanceDate || balanceAmount <= 0)) {
          this.$message.error(`第${index + 1}行已填写尾款/全款时，凭证、日期和金额都必须完整`)
          return false
        }
        if (hasBalance && this.roundMoney(balanceAmount) !== this.roundMoney(expectedBalanceAmount)) {
          this.$message.error(hasDeposit
            ? `第${index + 1}行尾款金额必须等于客户订单确认函总金额减定金金额`
            : `第${index + 1}行全款金额必须等于客户订单确认函总金额`)
          return false
        }
        recognizedTotal += Number(row.xianmuDepositRecognizedAmount || 0) + Number(row.xianmuBalanceRecognizedAmount || 0)
        if (!latestDate || (row.xianmuDepositDate && row.xianmuDepositDate > latestDate)) latestDate = row.xianmuDepositDate
        if (hasBalance && row.xianmuBalanceDate && row.xianmuBalanceDate > latestDate) latestDate = row.xianmuBalanceDate
        if (!firstFilePath) {
          if (row.xianmuDepositFilePath) {
            firstFilePath = row.xianmuDepositFilePath
            firstFileName = row.xianmuDepositFileName
          } else {
            firstFilePath = row.xianmuBalanceFilePath
            firstFileName = row.xianmuBalanceFileName
          }
        }
      }
      this.paymentForm.recognizedAmount = this.roundMoney(recognizedTotal)
      this.paymentForm.modifiedAmount = this.roundMoney(this.allocationTotal)
      this.paymentForm.paymentDate = latestDate
      this.paymentForm.filePath = firstFilePath
      this.paymentForm.fileName = firstFileName || '内部主体全款定金/尾款凭证'
      return true
    },
    confirmPayment () {
      if (!this.isFunderPayment && !this.prepareXianmuPaymentForm()) {
        return
      }
      this.$refs.paymentForm.validate(valid => {
        if (!valid) return
        if (!this.allocationMatched) {
          this.$message.error('预销售单分摊金额合计必须与修改金额完全一致')
          return
        }
        if ((this.paymentForm.allocationList || []).some(item => Number(item.allocationAmount || 0) <= 0)) {
          this.$message.error('每张预销售单的分摊金额都必须大于0')
          return
        }
        if (this.isFunderPayment) {
          const selectedFunder = this.funderOptions.find(item => item.id === this.paymentForm.funderId)
          if (selectedFunder && (selectedFunder.annualInterestRate === null || selectedFunder.annualInterestRate === undefined || Number(selectedFunder.annualInterestRate) <= 0)) {
            this.$message.error('所选资方未维护年利率，请先到往来单位维护')
            return
          }
          const missingPickupIndex = (this.paymentForm.allocationList || []).findIndex(item => !item.latestPickupDate)
          if (missingPickupIndex >= 0) {
            this.$message.error(`第${missingPickupIndex + 1}行确认函合同必须选择最迟提货日`)
            return
          }
          const invalidContributionIndex = (this.paymentForm.allocationList || []).findIndex(item => {
            if (!this.hasXianmuContribution(item)) return false
            const contributionAmount = Number(item.xianmuContributionModifiedAmount || 0)
            return !item.xianmuContributionFilePath ||
              !item.xianmuContributionDate ||
              contributionAmount <= 0 ||
              contributionAmount > Number(item.allocationAmount || 0)
          })
          if (invalidContributionIndex >= 0) {
            this.$message.error(`第${invalidContributionIndex + 1}行业务主体出资款凭证、日期和金额必须填写，且出资款不能大于资方全款金额`)
            return
          }
        }
        this.submitLoading = true
        const loadingText = this.isFunderPayment ? '正在确认打款并生成贷款记录...' : '正在确认内部主体全款打款...'
        const loading = this.$loading({ lock: true, text: loadingText })
        const payload = Object.assign({}, this.paymentForm)
        delete payload.recognizedReceipt
        if (this.isFunderPayment) {
          payload.payerId = null
        } else {
          payload.funderId = null
        }
        payload.allocationList = (this.paymentForm.allocationList || []).map(item => Object.assign({}, item, {
          allocationAmount: this.roundMoney(item.allocationAmount),
          xianmuContributionFlag: this.hasXianmuContribution(item) ? 1 : 0,
          xianmuContributionRecognizedAmount: this.roundMoney(item.xianmuContributionRecognizedAmount),
          xianmuContributionModifiedAmount: this.roundMoney(item.xianmuContributionModifiedAmount),
          xianmuDepositRecognizedAmount: this.roundMoney(item.xianmuDepositRecognizedAmount),
          xianmuDepositModifiedAmount: this.roundMoney(item.xianmuDepositModifiedAmount),
          xianmuBalanceRecognizedAmount: this.roundMoney(item.xianmuBalanceRecognizedAmount),
          xianmuBalanceModifiedAmount: this.roundMoney(item.xianmuBalanceModifiedAmount)
        }))
        this.$http({
          url: this.$http.adornUrl('/erp/funder-finance/payment/confirm'),
          method: 'post',
          data: this.$http.adornData(payload)
        }).then(({ data }) => {
          if (data && data.code === 0) {
            this.$message.success(this.isFunderPayment ? '资方全款打款已确认，贷款记录已生成' : '内部主体全款打款已确认')
            this.createVisible = false
            this.getDataList()
          } else {
            this.$message.error((data && data.msg) || '确认打款失败')
          }
        }).catch(() => this.$message.error('确认打款请求失败')).finally(() => {
          this.submitLoading = false
          loading.close()
        })
      })
    },
    openEditBalance (id) {
      const loading = this.$loading({ lock: true, text: '正在加载待尾款打款记录...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/payment/info/${id}`),
        method: 'get',
        params: this.$http.adornParams()
      }).then(({ data }) => {
        if (data && data.code === 0) {
          const payment = data.payment || {}
          payment.paymentType = PAYMENT_TYPE_XIANMU
          payment.selectedConfirmIds = (payment.allocationList || []).map(item => item.confirmId)
          payment.selectedConfirmId = payment.selectedConfirmIds[0] || null
          payment.recognizedReceipt = {}
          this.paymentForm = Object.assign(emptyPayment(PAYMENT_TYPE_XIANMU), payment)
          this.presaleOptions = (payment.allocationList || []).map(item => ({
            id: item.presaleOrderId,
            orderNo: item.presaleOrderNo,
            sellerContractNo: item.sellerContractNo,
            customerReference: item.customerReference,
            confirmInfo: {
              id: item.confirmId,
              contractNo: item.confirmContractNo,
              totalAmount: item.orderContractAmount || item.allocationAmount
            }
          }))
          this.createVisible = true
          this.searchInternalPayers('')
          this.$nextTick(() => this.$refs.paymentForm && this.$refs.paymentForm.clearValidate())
        } else {
          this.$message.error((data && data.msg) || '加载待尾款记录失败')
        }
      }).catch(() => this.$message.error('加载待尾款记录请求失败')).finally(() => loading.close())
    },
    openDetail (id) {
      const loading = this.$loading({ lock: true, text: '正在加载预销售单打款详情...' })
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
        link.download = fileName || '预销售单打款凭证'
        link.click()
        URL.revokeObjectURL(url)
      }).finally(() => loading.close())
    },
    previewVoucher (id) {
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/funder-finance/payment/download/${id}?preview=1&token=${encodeURIComponent(token)}`), '_blank')
    },
    downloadContract (id, fileName) {
      const loading = this.$loading({ lock: true, text: '正在下载归档合同...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/payment/download-contract/${id}`),
        method: 'get',
        responseType: 'blob'
      }).then(response => {
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || '资方全款合同'
        link.click()
        URL.revokeObjectURL(url)
      }).finally(() => loading.close())
    },
    previewContract (id) {
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/funder-finance/payment/download-contract/${id}?preview=1&token=${encodeURIComponent(token)}`), '_blank')
    },
    downloadContributionVoucher (allocationId, fileName) {
      const loading = this.$loading({ lock: true, text: '正在下载业务主体出资款凭证...' })
      this.$http({
        url: this.$http.adornUrl(`/erp/funder-finance/allocation/download/contribution/${allocationId}`),
        method: 'get',
        responseType: 'blob'
      }).then(response => {
        const url = URL.createObjectURL(response.data)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName || '业务主体出资款凭证'
        link.click()
        URL.revokeObjectURL(url)
      }).finally(() => loading.close())
    },
    previewContributionVoucher (allocationId) {
      const token = this.$cookie.get('token') || ''
      window.open(this.$http.adornUrl(`/erp/funder-finance/allocation/download/contribution/${allocationId}?preview=1&token=${encodeURIComponent(token)}`), '_blank')
    }
  }
}
</script>

<style scoped>
.mod-funder-payment .el-pagination {
  margin-top: 15px;
  text-align: right;
}
.option-extra {
  float: right;
  color: #8492a6;
  font-size: 12px;
  margin-left: 20px;
}
.file-name {
  margin-left: 12px;
  color: #606266;
}
.bank-voucher-tip {
  color: #909399;
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}
.row-support-tip {
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}
.section-title {
  margin: 8px 0 12px;
  font-weight: 700;
  color: #1f5f78;
}
.allocation-summary {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  margin-top: 12px;
}
.receipt-result {
  width: 100%;
}
.matched {
  color: #2b8a3e;
}
.mismatch {
  color: #d93025;
  font-weight: 700;
}
</style>
