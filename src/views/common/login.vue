<template>
  <div class="site-wrapper site-page--login">
    <test-environment-watermark v-if="testEnvironment" />
    <div class="site-content__wrapper">
      <div class="site-content">
        <div class="brand-info">
          <div class="brand-info__logo-card">
            <img class="brand-info__logo" src="~@/assets/img/xianmu-logo.png" alt="鲜牧ERP系统">
          </div>
          <p class="brand-info__eyebrow">XIANMU ERP SYSTEM</p>
          <h2 class="brand-info__text">鲜牧ERP系统</h2>
          <p class="brand-info__intro">覆盖预售、采购、入库、库存、销售与客户协同的一体化供应链管理平台。</p>
          <div class="brand-info__features">
            <span>进销存闭环</span>
            <span>OCR归档</span>
            <span>库存预警</span>
          </div>
        </div>
        <div class="login-main">
          <div v-if="testEnvironment" class="login-environment-badge">
            <strong>测试环境</strong>
            <span>当前数据仅用于测试</span>
          </div>
          <h3 class="login-title">管理员登录</h3>
          <el-form :model="dataForm" :rules="dataRule" ref="dataForm" @keyup.enter.native="dataFormSubmit()" status-icon>
            <el-form-item prop="userName">
              <el-input v-model="dataForm.userName" placeholder="帐号"></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="dataForm.password" type="password" placeholder="密码"></el-input>
            </el-form-item>
            <el-form-item class="login-captcha-form" prop="captcha">
              <el-row :gutter="20">
                <el-col :span="14">
                  <el-input v-model="dataForm.captcha" placeholder="验证码">
                  </el-input>
                </el-col>
                <el-col :span="10" class="login-captcha">
                  <img :src="captchaPath" @click="getCaptcha()" alt="">
                </el-col>
              </el-row>
            </el-form-item>
            <el-form-item class="login-mobile-option">
              <el-checkbox v-model="mobileLogin">手机端登录</el-checkbox>
              <span class="login-mobile-tip">勾选后进入手机工作台</span>
            </el-form-item>
            <el-form-item>
              <el-button class="login-btn-submit" type="primary" @click="dataFormSubmit()">登录</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getUUID } from '@/utils'
  import { getRuntimeEnvironment } from '@/utils/runtimeEnvironment'
  import TestEnvironmentWatermark from '@/components/test-environment-watermark'
  export default {
    components: {
      TestEnvironmentWatermark
    },
    data () {
      return {
        dataForm: {
          userName: '',
          password: '',
          uuid: '',
          captcha: ''
        },
        dataRule: {
          userName: [
            { required: true, message: '帐号不能为空', trigger: 'blur' }
          ],
          password: [
            { required: true, message: '密码不能为空', trigger: 'blur' }
          ],
          captcha: [
            { required: true, message: '验证码不能为空', trigger: 'blur' }
          ]
        },
        captchaPath: '',
        mobileLogin: false,
        testEnvironment: false
      }
    },
    created () {
      this.mobileLogin = this.getDefaultMobileLogin()
      this.loadRuntimeEnvironment()
      this.getCaptcha()
    },
    methods: {
      loadRuntimeEnvironment () {
        getRuntimeEnvironment().then(environment => {
          this.testEnvironment = environment.testEnvironment
        })
      },
      // 提交表单
      dataFormSubmit () {
        this.$refs['dataForm'].validate((valid) => {
          if (valid) {
            this.$http({
              url: this.$http.adornUrl('/sys/login'),
              method: 'post',
              data: this.$http.adornData({
                'username': this.dataForm.userName,
                'password': this.dataForm.password,
                'uuid': this.dataForm.uuid,
                'captcha': this.dataForm.captcha
              })
            }).then(({data}) => {
              if (data && data.code === 0) {
                this.$cookie.set('token', data.token)
                window.localStorage.setItem('xianmuMobileLogin', this.mobileLogin ? '1' : '0')
                const redirect = this.$route.query.redirect
                if (redirect) {
                  this.$router.replace(this.normalizeRedirect(decodeURIComponent(redirect)))
                } else if (this.mobileLogin) {
                  this.$router.replace({ name: 'mobile-home' })
                } else {
                  this.$router.replace({ name: 'home' })
                }
              } else {
                this.getCaptcha()
                this.$message.error(data.msg)
              }
            })
          }
        })
      },
      // 获取验证码
      getCaptcha () {
        this.dataForm.uuid = getUUID()
        this.captchaPath = this.$http.adornUrl(`/captcha.jpg?uuid=${this.dataForm.uuid}`)
      },
      getDefaultMobileLogin () {
        const fullPath = this.$route.fullPath || ''
        const href = window.location.href || ''
        if (this.$route.query.mobile === '1' || fullPath.indexOf('mobile=1') !== -1 || href.indexOf('mobile=1') !== -1) {
          return true
        }
        if (this.$route.query.mobile === '0' || fullPath.indexOf('mobile=0') !== -1 || href.indexOf('mobile=0') !== -1) {
          return false
        }
        const saved = window.localStorage.getItem('xianmuMobileLogin')
        if (saved === '1') {
          return true
        }
        if (saved === '0') {
          return false
        }
        return window.innerWidth <= 768
      },
      normalizeRedirect (redirect) {
        if (this.mobileLogin && redirect === '/erp-inventory-cost-mobile') {
          return '/mobile/inventory-cost'
        }
        return redirect
      }
    }
  }
</script>

<style lang="scss">
  .site-wrapper.site-page--login {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    min-width: 0;
    background:
      radial-gradient(circle at 18% 22%, rgba(62, 161, 73, .34), transparent 28%),
      radial-gradient(circle at 70% 72%, rgba(255, 167, 38, .16), transparent 32%),
      linear-gradient(135deg, #071452 0%, #09236f 46%, #0d6d61 100%);
    overflow: hidden;
    &:before {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      content: "";
      background:
        linear-gradient(120deg, rgba(255, 255, 255, .08) 0 1px, transparent 1px 120px),
        linear-gradient(30deg, rgba(255, 255, 255, .06) 0 1px, transparent 1px 96px);
      opacity: .42;
    }
    &:after {
      position: fixed;
      left: -120px;
      bottom: -160px;
      z-index: 0;
      width: 520px;
      height: 520px;
      content: "";
      border: 70px solid rgba(255, 255, 255, .08);
      border-radius: 50%;
    }
    .site-content__wrapper {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      padding: 0;
      margin: 0;
      overflow-x: hidden;
      overflow-y: auto;
      background-color: transparent;
    }
    .site-content {
      position: relative;
      z-index: 1;
      min-height: 100%;
      box-sizing: border-box;
      padding: 30px 500px 30px 30px;
    }
    .brand-info {
      max-width: 640px;
      margin: 150px 100px 0 90px;
      color: #fff;
    }
    .brand-info__logo-card {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 22px 28px;
      margin: 0 0 42px 0;
      background: rgba(255, 255, 255, .96);
      border-radius: 28px;
      box-shadow: 0 28px 70px rgba(0, 0, 0, .22);
    }
    .brand-info__logo {
      display: block;
      width: 300px;
      max-width: 100%;
    }
    .brand-info__eyebrow {
      margin: 0 0 14px 0;
      color: rgba(255, 255, 255, .72);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 4px;
    }
    .brand-info__text {
      margin:  0 0 24px 0;
      color: #fff;
      font-size: 56px;
      font-weight: 700;
      letter-spacing: 2px;
      text-shadow: 0 16px 36px rgba(0, 0, 0, .22);
    }
    .brand-info__intro {
      margin: 10px 0;
      max-width: 560px;
      color: rgba(255, 255, 255, .82);
      font-size: 18px;
      line-height: 1.78;
    }
    .brand-info__features {
      display: flex;
      flex-wrap: wrap;
      margin-top: 36px;
      span {
        display: inline-flex;
        align-items: center;
        margin: 0 14px 14px 0;
        padding: 10px 18px;
        color: #e8fff1;
        font-size: 14px;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, .24);
        border-radius: 999px;
        background: rgba(255, 255, 255, .1);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, .16);
      }
    }
    .login-main {
      position: absolute;
      top: 0;
      right: 0;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 60px;
      width: 470px;
      min-height: 100%;
      box-sizing: border-box;
      background: rgba(255, 255, 255, .96);
      box-shadow: -26px 0 70px rgba(0, 0, 0, .18);
    }
    .login-title {
      margin-bottom: 34px;
      color: #071452;
      font-size: 22px;
      font-weight: 700;
    }
    .login-environment-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 13px 16px;
      margin: 0 0 24px;
      color: #a42d1b;
      border: 1px solid rgba(220, 74, 45, .34);
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(255, 236, 229, .96), rgba(255, 248, 224, .96));
      box-shadow: 0 10px 26px rgba(180, 58, 36, .12);

      strong {
        font-size: 20px;
        letter-spacing: 2px;
      }

      span {
        color: #b85a40;
        font-size: 12px;
      }
    }
    .el-input__inner {
      height: 44px;
      line-height: 44px;
      border-color: #d9e4ef;
      border-radius: 12px;
      &:focus {
        border-color: #3ea149;
        box-shadow: 0 0 0 3px rgba(62, 161, 73, .12);
      }
    }
    .login-captcha {
      overflow: hidden;
      > img {
        height: 44px;
        border-radius: 12px;
        width: 100%;
        cursor: pointer;
      }
    }
    .login-mobile-option {
      margin: -4px 0 0;
      .el-form-item__content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        line-height: 22px;
      }
      .el-checkbox__label {
        color: #071452;
        font-weight: 600;
      }
    }
    .login-mobile-tip {
      color: #75859a;
      font-size: 12px;
    }
    .login-btn-submit {
      width: 100%;
      height: 46px;
      margin-top: 38px;
      font-size: 16px;
      font-weight: 700;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, #06135a, #1d8c68);
      box-shadow: 0 14px 28px rgba(9, 35, 111, .24);
    }
    @media (max-width: 900px) {
      .site-content {
        padding: 30px;
      }
      .brand-info {
        margin: 48px 0 32px;
      }
      .brand-info__logo-card {
        padding: 16px 20px;
        margin-bottom: 24px;
      }
      .brand-info__logo {
        width: 220px;
      }
      .brand-info__text {
        font-size: 38px;
      }
      .login-main {
        position: relative;
        width: auto;
        min-height: auto;
        padding: 34px 28px 42px;
        border-radius: 24px;
      }
    }
    @media (max-width: 600px) {
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      &:after {
        left: -180px;
        bottom: -220px;
        width: 360px;
        height: 360px;
        border-width: 48px;
      }
      .site-content__wrapper {
        min-width: 0;
        min-height: 100%;
      }
      .site-content {
        width: 100%;
        min-width: 0;
        min-height: 100%;
        padding: 22px 16px 28px;
      }
      .brand-info {
        margin: 18px 0 18px;
        text-align: center;
      }
      .brand-info__logo-card {
        padding: 12px 14px;
        margin-bottom: 14px;
        border-radius: 18px;
      }
      .brand-info__logo {
        width: 170px;
      }
      .brand-info__eyebrow {
        margin-bottom: 8px;
        font-size: 11px;
        letter-spacing: 2px;
      }
      .brand-info__text {
        margin-bottom: 10px;
        font-size: 28px;
        letter-spacing: 1px;
      }
      .brand-info__intro {
        display: none;
      }
      .brand-info__features {
        justify-content: center;
        margin-top: 14px;
        span {
          margin: 0 6px 8px;
          padding: 7px 11px;
          font-size: 12px;
        }
      }
      .login-main {
        width: 100%;
        padding: 26px 18px 28px;
        border-radius: 22px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, .2);
      }
      .login-title {
        margin-bottom: 22px;
        font-size: 20px;
        text-align: center;
      }
      .login-environment-badge {
        margin-bottom: 18px;
      }
      .el-form-item {
        margin-bottom: 18px;
      }
      .el-input__inner {
        height: 48px;
        line-height: 48px;
        font-size: 16px;
        border-radius: 14px;
      }
      .login-captcha {
        > img {
          height: 48px;
          border-radius: 14px;
          object-fit: cover;
        }
      }
      .login-btn-submit {
        height: 50px;
        margin-top: 18px;
        border-radius: 16px;
      }
    }
    @media (max-width: 420px) {
      .site-content {
        padding-right: 12px;
        padding-left: 12px;
      }
      .brand-info__features {
        display: none;
      }
      .login-main {
        padding: 24px 14px 26px;
      }
      .login-captcha-form .el-row {
        margin-right: -5px !important;
        margin-left: -5px !important;
      }
      .login-captcha-form .el-col {
        padding-right: 5px !important;
        padding-left: 5px !important;
      }
    }
  }
</style>
