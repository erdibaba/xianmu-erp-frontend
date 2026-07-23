<template>
  <el-dialog
    title="上传识别入库单"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="900px">
    <div class="inbound-upload-dialog">
      <el-alert
        title="支持多文件上传识别。系统会自动归档原件，并汇总识别司机信息、WMS订单号、客户订单号和SKU明细。"
        type="info"
        :closable="false"
        show-icon>
      </el-alert>

      <el-upload
        class="upload-box"
        drag
        multiple
        action=""
        :auto-upload="false"
        :show-file-list="true"
        :http-request="handleRequest"
        :before-upload="beforeUpload"
        :on-change="handleChange"
        :on-remove="handleRemove"
        :file-list="fileList"
        :accept="'.jpg,.jpeg,.png,.jfif,.bmp,.pdf'">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将多个入库单文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">支持 JPG / PNG / JFIF / BMP / PDF，可一次上传多页入库单</div>
      </el-upload>

      <div class="action-bar">
        <el-button type="primary" :loading="loading" @click="submitUpload()">识别入库单</el-button>
        <el-button @click="visible = false">关闭</el-button>
      </div>

      <div v-if="resultData" class="result-box">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="WMS订单号">{{ ((resultData.inboundDraft || {}).wmsOrderNo) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户订单号">{{ ((resultData.inboundDraft || {}).customerOrderNo) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="司机姓名">{{ ((resultData.inboundDraft || {}).driverName) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="司机电话">{{ ((resultData.inboundDraft || {}).driverPhone) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="归档文件数">{{ ((resultData.inboundDraft || {}).fileList || []).length }}</el-descriptions-item>
          <el-descriptions-item label="识别明细行数">{{ ((resultData.inboundDraft || {}).itemList || []).length }}</el-descriptions-item>
        </el-descriptions>
        <el-table
          v-if="recognizedItems.length"
          :data="recognizedItems"
          border
          size="mini"
          max-height="260"
          class="recognized-preview-table">
          <el-table-column type="index" label="序号" width="55" align="center"></el-table-column>
          <el-table-column prop="productCode" label="产品编码" width="110"></el-table-column>
          <el-table-column prop="productName" label="识别品名" min-width="180" show-overflow-tooltip></el-table-column>
          <el-table-column prop="factoryNo" label="厂号" width="80"></el-table-column>
          <el-table-column prop="expectedQty" label="预期数" width="85" align="right"></el-table-column>
          <el-table-column prop="actualQty" label="实收数" width="85" align="right"></el-table-column>
          <el-table-column prop="totalWeightKg" label="合计重量(KG)" width="120" align="right"></el-table-column>
        </el-table>
        <el-alert
          v-else
          title="本次未识别到明细行，请更换清晰文件重试或进入维护窗口手工新增。"
          type="warning"
          :closable="false"
          show-icon
          class="empty-result-alert">
        </el-alert>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :disabled="!resultData" @click="confirmHandle()">带入编辑</el-button>
    </span>
  </el-dialog>
</template>

<script>
export default {
  props: {
    presaleOrderId: {
      type: [Number, String],
      default: 0
    },
    confirmId: {
      type: [Number, String],
      default: 0
    }
  },
  data () {
    return {
      visible: false,
      loading: false,
      fileList: [],
      resultData: null
    }
  },
  computed: {
    recognizedItems () {
      return (((this.resultData || {}).inboundDraft || {}).itemList || [])
    }
  },
  methods: {
    init () {
      this.visible = true
      this.loading = false
      this.fileList = []
      this.resultData = null
    },
    beforeUpload (file) {
      const allow = /\.(jpg|jpeg|png|jfif|bmp|pdf)$/i.test(file.name)
      if (!allow) {
        this.$message.error('仅支持 jpg/jpeg/png/jfif/bmp/pdf 文件')
      }
      return allow
    },
    handleChange (file, fileList) {
      this.fileList = fileList
    },
    handleRemove (file, fileList) {
      this.fileList = fileList
    },
    handleRequest () {},
    submitUpload () {
      if (!this.presaleOrderId) {
        this.$message.error('缺少预销售单信息')
        return
      }
      if (!this.fileList.length) {
        this.$message.error('请先选择文件')
        return
      }
      this.loading = true
      const formData = new FormData()
      formData.append('presaleOrderId', this.presaleOrderId)
      formData.append('confirmId', this.confirmId || 0)
      this.fileList.forEach(item => {
        formData.append('files', item.raw || item)
      })
      this.$http({
        url: this.$http.adornUrl('/erp/inbound/recognize'),
        method: 'post',
        timeout: 1000 * 180,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then(({ data }) => {
        if (data && data.code === 0) {
          this.resultData = data.result
        } else {
          this.$message.error((data && data.msg) || '识别失败')
        }
        this.loading = false
      }).catch((error) => {
        this.loading = false
        const responseMsg = (((error || {}).response || {}).data || {}).msg
        this.$message.error(responseMsg || '识别请求已中断，请重试')
      })
    },
    confirmHandle () {
      if (!this.resultData) {
        this.$message.error('请先完成入库单识别')
        return
      }
      const result = JSON.parse(JSON.stringify(this.resultData))
      this.visible = false
      this.$nextTick(() => {
        this.$emit('recognized', result)
      })
    }
  }
}
</script>

<style scoped>
.inbound-upload-dialog .upload-box {
  margin-top: 15px;
}

.inbound-upload-dialog .action-bar {
  margin: 15px 0;
}

.inbound-upload-dialog .result-box {
  margin-top: 10px;
}

.recognized-preview-table {
  margin-top: 12px;
}

.empty-result-alert {
  margin-top: 12px;
}
</style>
