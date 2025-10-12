@echo off
REM 快速测试脚本 - 请修改下面的URL为您的实际网站地址

echo ========================================
echo   快速生产环境测试
echo ========================================
echo.

REM ⚠️ 重要: 请将下面的URL改为您的实际网站地址
set SITE_URL=https://your-site.netlify.app

echo 测试网站: %SITE_URL%
echo.
echo 正在测试数据分析页面 (验证NaN问题)...
echo.

REM 设置环境变量
set BASE_URL=%SITE_URL%

REM 运行数据分析页面测试
call pnpm test:e2e tests/e2e/08-production.spec.ts -g "数据分析页面完整测试" --config=playwright.config.prod.ts

echo.
echo ========================================
echo   测试完成！
echo ========================================
echo.

set /p show_report="是否查看详细报告？(Y/N): "
if /i "%show_report%"=="Y" (
    call npx playwright show-report playwright-report-prod
)

pause

