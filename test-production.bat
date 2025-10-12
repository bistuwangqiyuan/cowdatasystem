@echo off
REM 生产环境自动化测试脚本 (Windows)
REM 用于测试已部署的网站

echo ========================================
echo   奶牛管理系统 - 生产环境测试
echo ========================================
echo.

REM 检查是否提供了URL
if "%1"=="" (
    echo 错误: 请提供生产环境URL
    echo.
    echo 使用方法:
    echo   test-production.bat https://your-site.netlify.app
    echo.
    pause
    exit /b 1
)

set PROD_URL=%1

echo 测试目标: %PROD_URL%
echo.
echo 测试范围:
echo   - 健康记录页面
echo   - 繁殖管理页面
echo   - 饲料管理页面
echo   - 数据分析页面 (NaN验证)
echo.

:menu
echo 请选择测试方式:
echo [1] 运行所有生产环境测试
echo [2] 只测试数据分析页面 (NaN验证)
echo [3] 只测试健康记录页面
echo [4] 只测试繁殖管理页面
echo [5] 只测试饲料管理页面
echo [6] 使用UI模式测试 (推荐)
echo [0] 退出
echo.

set /p choice="请输入选项 (0-6): "

if "%choice%"=="1" goto test_all
if "%choice%"=="2" goto test_analytics
if "%choice%"=="3" goto test_health
if "%choice%"=="4" goto test_breeding
if "%choice%"=="5" goto test_feed
if "%choice%"=="6" goto test_ui
if "%choice%"=="0" goto end

echo 无效选项
echo.
goto menu

:test_all
echo.
echo 运行所有生产环境测试...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e tests/e2e/08-production.spec.ts --config=playwright.config.prod.ts
goto show_report

:test_analytics
echo.
echo 测试数据分析页面 (重点验证NaN问题)...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e tests/e2e/08-production.spec.ts -g "数据分析" --config=playwright.config.prod.ts
goto show_report

:test_health
echo.
echo 测试健康记录页面...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e tests/e2e/08-production.spec.ts -g "健康记录" --config=playwright.config.prod.ts
goto show_report

:test_breeding
echo.
echo 测试繁殖管理页面...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e tests/e2e/08-production.spec.ts -g "繁殖管理" --config=playwright.config.prod.ts
goto show_report

:test_feed
echo.
echo 测试饲料管理页面...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e tests/e2e/08-production.spec.ts -g "饲料管理" --config=playwright.config.prod.ts
goto show_report

:test_ui
echo.
echo 启动UI模式...
echo.
set BASE_URL=%PROD_URL%
call pnpm test:e2e:ui tests/e2e/08-production.spec.ts --config=playwright.config.prod.ts
goto end

:show_report
echo.
echo ========================================
echo   测试完成！
echo ========================================
echo.
set /p show_report="是否查看测试报告？(Y/N): "
if /i "%show_report%"=="Y" (
    echo 正在打开测试报告...
    call npx playwright show-report playwright-report-prod
)
echo.
set /p continue="是否继续测试？(Y/N): "
if /i "%continue%"=="Y" goto menu
goto end

:end
echo.
echo 测试结束
pause

