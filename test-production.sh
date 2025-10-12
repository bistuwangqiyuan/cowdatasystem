#!/bin/bash
# 生产环境自动化测试脚本 (Linux/Mac)
# 用于测试已部署的网站

echo "========================================"
echo "  奶牛管理系统 - 生产环境测试"
echo "========================================"
echo

# 检查是否提供了URL
if [ -z "$1" ]; then
    echo "错误: 请提供生产环境URL"
    echo
    echo "使用方法:"
    echo "  ./test-production.sh https://your-site.netlify.app"
    echo
    exit 1
fi

PROD_URL=$1

echo "测试目标: $PROD_URL"
echo
echo "测试范围:"
echo "  - 健康记录页面"
echo "  - 繁殖管理页面"
echo "  - 饲料管理页面"
echo "  - 数据分析页面 (NaN验证)"
echo

function show_menu() {
    echo "请选择测试方式:"
    echo "[1] 运行所有生产环境测试"
    echo "[2] 只测试数据分析页面 (NaN验证)"
    echo "[3] 只测试健康记录页面"
    echo "[4] 只测试繁殖管理页面"
    echo "[5] 只测试饲料管理页面"
    echo "[6] 使用UI模式测试 (推荐)"
    echo "[0] 退出"
    echo
}

function show_report_prompt() {
    echo
    echo "========================================"
    echo "  测试完成！"
    echo "========================================"
    echo
    read -p "是否查看测试报告？(Y/N): " show_report
    if [[ $show_report =~ ^[Yy]$ ]]; then
        echo "正在打开测试报告..."
        npx playwright show-report playwright-report-prod
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

function test_all() {
    echo
    echo "运行所有生产环境测试..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e tests/e2e/08-production.spec.ts --config=playwright.config.prod.ts
    show_report_prompt
    continue_prompt
}

function test_analytics() {
    echo
    echo "测试数据分析页面 (重点验证NaN问题)..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e tests/e2e/08-production.spec.ts -g "数据分析" --config=playwright.config.prod.ts
    show_report_prompt
    continue_prompt
}

function test_health() {
    echo
    echo "测试健康记录页面..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e tests/e2e/08-production.spec.ts -g "健康记录" --config=playwright.config.prod.ts
    show_report_prompt
    continue_prompt
}

function test_breeding() {
    echo
    echo "测试繁殖管理页面..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e tests/e2e/08-production.spec.ts -g "繁殖管理" --config=playwright.config.prod.ts
    show_report_prompt
    continue_prompt
}

function test_feed() {
    echo
    echo "测试饲料管理页面..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e tests/e2e/08-production.spec.ts -g "饲料管理" --config=playwright.config.prod.ts
    show_report_prompt
    continue_prompt
}

function test_ui() {
    echo
    echo "启动UI模式..."
    echo
    BASE_URL=$PROD_URL pnpm test:e2e:ui tests/e2e/08-production.spec.ts --config=playwright.config.prod.ts
    exit 0
}

function main() {
    show_menu
    read -p "请输入选项 (0-6): " choice
    
    case $choice in
        1) test_all ;;
        2) test_analytics ;;
        3) test_health ;;
        4) test_breeding ;;
        5) test_feed ;;
        6) test_ui ;;
        0) echo "测试结束"; exit 0 ;;
        *) echo "无效选项"; echo; main ;;
    esac
}

# 确保脚本可执行
chmod +x "$0" 2>/dev/null

# 启动主菜单
main

