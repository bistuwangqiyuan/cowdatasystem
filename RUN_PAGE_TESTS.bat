@echo off
REM Windows批处理脚本：运行页面测试
REM 用于快速测试健康记录、繁殖管理、饲料管理和数据分析页面

echo ========================================
echo   奶牛管理系统 - 页面测试运行器
echo ========================================
echo.

:menu
echo 请选择要运行的测试：
echo.
echo [1] 运行所有新增测试
echo [2] 测试健康记录页面
echo [3] 测试繁殖管理页面
echo [4] 测试饲料管理页面
echo [5] 测试数据分析页面 (NaN问题验证)
echo [6] 使用UI模式运行所有测试
echo [7] 运行所有E2E测试
echo [0] 退出
echo.

set /p choice="请输入选项 (0-7): "

if "%choice%"=="1" goto test_new
if "%choice%"=="2" goto test_health
if "%choice%"=="3" goto test_breeding
if "%choice%"=="4" goto test_feed
if "%choice%"=="5" goto test_analytics
if "%choice%"=="6" goto test_ui
if "%choice%"=="7" goto test_all
if "%choice%"=="0" goto end

echo 无效选项，请重新选择
echo.
goto menu

:test_new
echo.
echo 运行健康记录、繁殖管理、饲料管理、数据分析测试...
echo.
call pnpm test:e2e tests/e2e/04-health-records.spec.ts tests/e2e/05-breeding.spec.ts tests/e2e/06-feed.spec.ts tests/e2e/07-analytics.spec.ts
goto show_report

:test_health
echo.
echo 运行健康记录页面测试...
echo.
call pnpm test:e2e tests/e2e/04-health-records.spec.ts
goto show_report

:test_breeding
echo.
echo 运行繁殖管理页面测试...
echo.
call pnpm test:e2e tests/e2e/05-breeding.spec.ts
goto show_report

:test_feed
echo.
echo 运行饲料管理页面测试...
echo.
call pnpm test:e2e tests/e2e/06-feed.spec.ts
goto show_report

:test_analytics
echo.
echo 运行数据分析页面测试（包含NaN问题验证）...
echo.
call pnpm test:e2e tests/e2e/07-analytics.spec.ts
goto show_report

:test_ui
echo.
echo 启动Playwright测试UI...
echo.
call pnpm test:e2e:ui
goto end

:test_all
echo.
echo 运行所有E2E测试...
echo.
call pnpm test:e2e
goto show_report

:show_report
echo.
echo ========================================
echo   测试完成！
echo ========================================
echo.
set /p show_report="是否查看HTML报告？(Y/N): "
if /i "%show_report%"=="Y" (
    echo 正在打开测试报告...
    call npx playwright show-report
)
echo.
set /p continue="是否继续测试？(Y/N): "
if /i "%continue%"=="Y" goto menu
goto end

:end
echo.
echo 测试运行器已退出
pause

