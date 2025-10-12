#!/bin/bash
# Linux/Mac脚本：运行页面测试
# 用于快速测试健康记录、繁殖管理、饲料管理和数据分析页面

echo "========================================"
echo "  奶牛管理系统 - 页面测试运行器"
echo "========================================"
echo

function show_menu() {
    echo "请选择要运行的测试："
    echo
    echo "[1] 运行所有新增测试"
    echo "[2] 测试健康记录页面"
    echo "[3] 测试繁殖管理页面"
    echo "[4] 测试饲料管理页面"
    echo "[5] 测试数据分析页面 (NaN问题验证)"
    echo "[6] 使用UI模式运行所有测试"
    echo "[7] 运行所有E2E测试"
    echo "[0] 退出"
    echo
}

function show_report_prompt() {
    echo
    echo "========================================"
    echo "  测试完成！"
    echo "========================================"
    echo
    read -p "是否查看HTML报告？(Y/N): " show_report
    if [[ $show_report =~ ^[Yy]$ ]]; then
        echo "正在打开测试报告..."
        npx playwright show-report
    fi
}

function continue_prompt() {
    echo
    read -p "是否继续测试？(Y/N): " continue_test
    if [[ $continue_test =~ ^[Yy]$ ]]; then
        main
    else
        exit 0
    fi
}

function test_new() {
    echo
    echo "运行健康记录、繁殖管理、饲料管理、数据分析测试..."
    echo
    pnpm test:e2e tests/e2e/04-health-records.spec.ts tests/e2e/05-breeding.spec.ts tests/e2e/06-feed.spec.ts tests/e2e/07-analytics.spec.ts
    show_report_prompt
    continue_prompt
}

function test_health() {
    echo
    echo "运行健康记录页面测试..."
    echo
    pnpm test:e2e tests/e2e/04-health-records.spec.ts
    show_report_prompt
    continue_prompt
}

function test_breeding() {
    echo
    echo "运行繁殖管理页面测试..."
    echo
    pnpm test:e2e tests/e2e/05-breeding.spec.ts
    show_report_prompt
    continue_prompt
}

function test_feed() {
    echo
    echo "运行饲料管理页面测试..."
    echo
    pnpm test:e2e tests/e2e/06-feed.spec.ts
    show_report_prompt
    continue_prompt
}

function test_analytics() {
    echo
    echo "运行数据分析页面测试（包含NaN问题验证）..."
    echo
    pnpm test:e2e tests/e2e/07-analytics.spec.ts
    show_report_prompt
    continue_prompt
}

function test_ui() {
    echo
    echo "启动Playwright测试UI..."
    echo
    pnpm test:e2e:ui
    exit 0
}

function test_all() {
    echo
    echo "运行所有E2E测试..."
    echo
    pnpm test:e2e
    show_report_prompt
    continue_prompt
}

function main() {
    show_menu
    read -p "请输入选项 (0-7): " choice
    
    case $choice in
        1) test_new ;;
        2) test_health ;;
        3) test_breeding ;;
        4) test_feed ;;
        5) test_analytics ;;
        6) test_ui ;;
        7) test_all ;;
        0) echo "测试运行器已退出"; exit 0 ;;
        *) echo "无效选项，请重新选择"; echo; main ;;
    esac
}

# 确保脚本可执行
chmod +x "$0" 2>/dev/null

# 启动主菜单
main

