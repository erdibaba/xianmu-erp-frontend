<template>
  <el-dialog
    :title="dataForm.id ? '修改司机信息' : '新增司机信息'"
    :close-on-click-modal="false"
    :visible.sync="visible"
    width="520px">
    <el-form :model="dataForm" :rules="dataRule" ref="dataForm" label-width="90px">
      <el-form-item label="司机姓名" prop="driverName">
        <el-input v-model.trim="dataForm.driverName" maxlength="100" show-word-limit></el-input>
      </el-form-item>
      <el-form-item label="车牌号" prop="plateNo">
        <el-input v-model.trim="dataForm.plateNo" maxlength="50"></el-input>
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model.trim="dataForm.mobile" maxlength="50"></el-input>
      </el-form-item>
      <el-form-item label="身份证号">
        <el-input v-model.trim="dataForm.idCardNo" maxlength="100"></el-input>
      </el-form-item>
      <el-form-item label="状态">
        <el-switch
          v-model="dataForm.status"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="停用">
        </el-switch>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button :disabled="submitLoading" @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="dataFormSubmit()">确定</el-button>
    </span>
  </el-dialog>
</template>

<script>
  const defaultForm = () => ({
    id: 0,
    driverName: '',
    plateNo: '',
    mobile: '',
    idCardNo: '',
    status: 1
  })

  export default {
    data () {
      return {
        visible: false,
        submitLoading: false,
        dataForm: defaultForm(),
        dataRule: {
          driverName: [
            { required: true, message: '司机姓名不能为空', trigger: 'blur' }
          ],
          plateNo: [
            { required: true, message: '车牌号不能为空', trigger: 'blur' }
          ],
          mobile: [
            { required: true, message: '手机号不能为空', trigger: 'blur' }
          ]
        }
      }
    },
    methods: {
      init (id) {
        this.visible = true
        this.submitLoading = false
        this.dataForm = defaultForm()
        this.dataForm.id = id || 0
        this.$nextTick(() => {
          this.$refs.dataForm.resetFields()
          if (this.dataForm.id) {
            this.$http({
              url: this.$http.adornUrl(`/erp/driver/info/${this.dataForm.id}`),
              method: 'get',
              params: this.$http.adornParams()
            }).then(({data}) => {
              if (data && data.code === 0) {
                this.dataForm = Object.assign(defaultForm(), data.driver || {})
              } else {
                this.$message.error(data.msg || '获取司机信息失败')
              }
            })
          }
        })
      },
      dataFormSubmit () {
        this.$refs.dataForm.validate((valid) => {
          if (!valid || this.submitLoading) {
            return
          }
          this.submitLoading = true
          this.$http({
            url: this.$http.adornUrl(`/erp/driver/${this.dataForm.id ? 'update' : 'save'}`),
            method: 'post',
            data: this.$http.adornData(this.dataForm)
          }).then(({data}) => {
            if (data && data.code === 0) {
              this.$message.success('保存成功')
              this.visible = false
              this.$emit('refreshDataList')
            } else {
              this.$message.error(data.msg || '保存失败')
            }
          }).finally(() => {
            this.submitLoading = false
          })
        })
      }
    }
  }
</script>
