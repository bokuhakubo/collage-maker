document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');
    const uploadedImages = document.getElementById('uploadedImages');
    const mainPreview = document.getElementById('mainPreview');
    const layoutOptions = document.getElementById('layoutOptions');
    const collageSection = document.getElementById('collageSection');
    const aspectRatioButtons = document.querySelectorAll('.aspect-ratio-btn');
    const socialMediaButtons = document.querySelectorAll('.social-media-btn');
    const paddingControl = document.getElementById('padding');
    const paddingNumberInput = document.getElementById('paddingNumber');
    const gapControl = document.getElementById('gap');
    const gapNumberInput = document.getElementById('gapNumber');
    const cornerRadiusControl = document.getElementById('cornerRadius');
    const cornerRadiusNumberInput = document.getElementById('cornerRadiusNumber');
    const bgColorControl = document.getElementById('bgColor');
    const colorPickerBtn = document.getElementById('colorPickerBtn');
    const colorPreview = colorPickerBtn.querySelector('.color-preview');
    const colorPresets = document.querySelectorAll('.color-preset');
    const resetButton = document.getElementById('resetCollage');
    const downloadButton = document.getElementById('downloadCollage');
    
    // モーダル関連の要素
    const modal = document.getElementById('sizeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalOptions = document.getElementById('modalOptions');
    const closeBtn = document.querySelector('.close-btn');

    const zoomSelect = document.getElementById('zoomSelect');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    let images = [];
    let currentLayout = null;
    let currentAspectRatio = '1:1';
    let customWidth = 0;
    let customHeight = 0;

    // 現在のズームレベルを追跡
    let currentZoom = 100; // パーセント
    let originalWidth = 0;
    let originalHeight = 0;

    // 画像入れ替え関連の変数
    let selectedImageIndex = -1; // 選択中の画像インデックス
    let isSwapMode = false; // 入れ替えモード状態フラグ
    let swapIconElement = null; // 入れ替えアイコン要素
    let highlightElement = null; // 選択中の画像ハイライト要素
    let positionAdjustElement = null; // 位置調整アイコン要素
    let imagePositionOffsets = {}; // 画像位置のオフセットを保存するオブジェクト

    // 位置調整関連の変数
    let isAdjustMode = false; // 位置調整モード状態フラグ
    let isDragging = false; // ドラッグ中フラグ
    let dragStartX = 0; // ドラッグ開始X座標
    let dragStartY = 0; // ドラッグ開始Y座標
    let currentOffsetX = 0; // 現在のXオフセット
    let currentOffsetY = 0; // 現在のYオフセット

    // SNSサイズのデータ
    const snsSizes = {
        x: [
            { title: 'Single Image', width: 1600, height: 900, ratio: '16:9' },
            { title: 'Multiple Images', width: 1200, height: 675, ratio: '16:9' },
            { title: 'Card Image', width: 1200, height: 628, ratio: '1.91:1' },
            { title: 'Profile Image', width: 400, height: 400, ratio: '1:1' },
            { title: 'Header Image', width: 1500, height: 500, ratio: '3:1' }
        ],
        instagram: [
            { title: 'Square Post', width: 1080, height: 1080, ratio: '1:1' },
            { title: 'Portrait Post', width: 1080, height: 1350, ratio: '4:5' },
            { title: 'Landscape Post', width: 1080, height: 566, ratio: '1.91:1' },
            { title: 'Stories', width: 1080, height: 1920, ratio: '9:16' },
            { title: 'Reels', width: 1080, height: 1920, ratio: '9:16' },
            { title: 'IGTV Cover', width: 420, height: 654, ratio: '2:3' },
            { title: 'Profile Image', width: 320, height: 320, ratio: '1:1' }
        ],
        threads: [
            { title: 'Square Post', width: 1080, height: 1080, ratio: '1:1' },
            { title: 'Portrait Post', width: 1080, height: 1350, ratio: '4:5' },
            { title: 'Landscape Post', width: 1080, height: 608, ratio: '16:9' },
            { title: 'Profile Image', width: 320, height: 320, ratio: '1:1' }
        ]
    };

    // アスペクト比の設定
    aspectRatioButtons.forEach(button => {
        button.addEventListener('click', () => {
            aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentAspectRatio = button.dataset.ratio;
            customWidth = 0;
            customHeight = 0;
            
            // SNSボタンのアクティブ状態を解除
            socialMediaButtons.forEach(btn => btn.classList.remove('active'));
            
            // アスペクト比変更時はレイアウトオプションも再描画
            updateCollage();
            updateLayoutOptions();
        });
    });

    // SNSサイズボタンのイベント
    socialMediaButtons.forEach(button => {
        button.addEventListener('click', () => {
            const platform = button.dataset.platform;
            showSizeOptions(platform);
        });
    });

    // モーダルを閉じる
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // モーダル外をクリックしても閉じる
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // SNSサイズオプションを表示
    function showSizeOptions(platform) {
        const sizes = snsSizes[platform];
        modalTitle.textContent = `Select ${platform === 'x' ? 'X (Twitter)' : platform} Image Size`;
        modalOptions.innerHTML = '';
        
        // SNSボタンのアクティブ状態を更新
        socialMediaButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.platform === platform) {
                btn.classList.add('active');
            }
        });

        sizes.forEach(size => {
            const option = document.createElement('div');
            option.className = 'size-option';
            
            const title = document.createElement('div');
            title.className = 'size-option-title';
            title.textContent = size.title;
            
            const dimensions = document.createElement('div');
            dimensions.className = 'size-option-dimensions';
            dimensions.textContent = `${size.width} x ${size.height} px（${size.ratio}）`;
            
            option.appendChild(title);
            option.appendChild(dimensions);
            
            option.addEventListener('click', () => {
                // 選択されたサイズを設定
                customWidth = size.width;
                customHeight = size.height;
                currentAspectRatio = size.ratio;
                
                // アスペクト比ボタンのアクティブ状態をすべて解除
                aspectRatioButtons.forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // モーダルを閉じて更新
                modal.style.display = 'none';
                updateCollage();
            });
            
            modalOptions.appendChild(option);
        });
        
        modal.style.display = 'block';
    }

    // デバウンス関数の実装 - 連続した呼び出しを遅延させる
    function debounce(func, wait = 100) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    // 更新関数をデバウンス
    const debouncedUpdateCollage = debounce(updateCollage, 50);

    // パディング、ギャップ、背景色変更のイベントハンドラ
    paddingControl.addEventListener('input', () => {
        paddingNumberInput.value = paddingControl.value;
        debouncedUpdateCollage();
    });

    paddingNumberInput.addEventListener('input', () => {
        paddingControl.value = paddingNumberInput.value;
        debouncedUpdateCollage();
    });

    gapControl.addEventListener('input', () => {
        gapNumberInput.value = gapControl.value;
        debouncedUpdateCollage();
    });

    gapNumberInput.addEventListener('input', () => {
        gapControl.value = gapNumberInput.value;
        debouncedUpdateCollage();
    });

    // 角丸スライダーの連動
    cornerRadiusControl.addEventListener('input', () => {
        cornerRadiusNumberInput.value = cornerRadiusControl.value;
        debouncedUpdateCollage();
    });

    cornerRadiusNumberInput.addEventListener('input', () => {
        cornerRadiusControl.value = cornerRadiusNumberInput.value;
        debouncedUpdateCollage();
    });

    // 背景色の変更
    bgColorControl.addEventListener('input', () => {
        const color = bgColorControl.value;
        colorPreview.style.backgroundColor = color;
        // プリセットと一致する場合はアクティブに
        colorPresets.forEach(preset => {
            if (preset.dataset.color.toLowerCase() === color.toLowerCase()) {
                colorPresets.forEach(p => p.classList.remove('active'));
                preset.classList.add('active');
            }
        });
        debouncedUpdateCollage();
    });

    // カラーピッカーボタン
    colorPickerBtn.addEventListener('click', () => {
        bgColorControl.click();
    });

    // カラープリセットの設定
    colorPresets.forEach(preset => {
        preset.addEventListener('click', () => {
            colorPresets.forEach(p => p.classList.remove('active'));
            preset.classList.add('active');
            const color = preset.dataset.color;
            bgColorControl.value = color;
            colorPreview.style.backgroundColor = color;
            updateCollage(); // プリセット選択は即時更新
        });
    });

    // ドラッグ＆ドロップのイベントハンドラ
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#3498db';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        handleFiles(files);
    });

    // クリックでファイル選択
    dropZone.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        handleFiles(Array.from(e.target.files));
    });

    // ファイル処理
    function handleFiles(files) {
        if (images.length + files.length > 3) {
            alert('You can upload up to 3 images.');
            return;
        }

        // アップロード開始時に先にプレースホルダーを作成
        const placeholders = [];
        files.forEach(file => {
            // 仮の画像オブジェクトを作成（実際の画像はまだロードされていない）
            const placeholder = new Image();
            placeholder.dataset.loading = "true"; // ロード中フラグを設定
            placeholders.push(placeholder);
            images.push(placeholder);
        });
        
        // プレースホルダーを先に表示
        updateUploadedImages();

        // 実際の画像ファイルを読み込む
        files.forEach((file, idx) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    // 読み込み完了後、プレースホルダーを実際の画像で置き換え
                    const index = images.indexOf(placeholders[idx]);
                    if (index !== -1) {
                        images[index] = img;
                        updateUploadedImages();
                    }
                    
                    // 1枚以上あればコラージュセクションを表示
                    if (images.length >= 1) {
                        collageSection.style.display = 'block';
                        generateCollage();
                    }
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // アップロードされた画像の表示を更新
    function updateUploadedImages() {
        uploadedImages.innerHTML = '';
        images.forEach((img, index) => {
            const container = document.createElement('div');
            container.className = 'image-container';
            
            // ローディング中かどうかを確認
            const isLoading = img.dataset && img.dataset.loading === "true";
            
            // ローディング表示を追加
            if (isLoading) {
                const loadingDiv = document.createElement('div');
                loadingDiv.className = 'image-loading';
                const spinner = document.createElement('div');
                spinner.className = 'image-spinner';
                loadingDiv.appendChild(spinner);
                container.appendChild(loadingDiv);
            }
            
            const imgElement = document.createElement('img');
            if (!isLoading) {
                imgElement.src = img.src;
            }
            
            const actions = document.createElement('div');
            actions.className = 'image-actions';
            
            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteButton.onclick = () => {
                images.splice(index, 1);
                updateUploadedImages();
                if (images.length < 1) {
                    collageSection.style.display = 'none';
                } else {
                    generateCollage();
                }
            };
            
            const changeButton = document.createElement('button');
            changeButton.innerHTML = '<i class="fas fa-pencil"></i>';
            changeButton.onclick = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        // 既存の画像をローディング状態に変更
                        images[index].dataset = images[index].dataset || {};
                        images[index].dataset.loading = "true";
                        updateUploadedImages();
                        
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const newImg = new Image();
                            newImg.onload = () => {
                                // 既存の画像を新しい画像に置き換え
                                images[index] = newImg;
                                // コラージュを更新
                                updateUploadedImages();
                                generateCollage();
                            };
                            newImg.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            };
            
            actions.appendChild(deleteButton);
            actions.appendChild(changeButton);
            container.appendChild(imgElement);
            container.appendChild(actions);
            uploadedImages.appendChild(container);
        });
    }

    // コラージュ生成
    function generateCollage() {
        if (images.length < 1) return; // 1枚以上あれば処理を続行

        // レイアウトパターンの生成
        const layouts = generateLayouts();
        layoutOptions.innerHTML = '';
        
        layouts.forEach((layout, index) => {
            // レイアウトパターンを描画するためのキャンバスを作成
            const layoutCanvas = document.createElement('canvas');
            const layoutCtx = layoutCanvas.getContext('2d');
            layoutCanvas.width = 100;
            layoutCanvas.height = 100;
            
            // パターン背景を描画
            layoutCtx.fillStyle = '#f3f4f6';
            layoutCtx.fillRect(0, 0, layoutCanvas.width, layoutCanvas.height);
            
            // レイアウト枠を描画
            layoutCtx.fillStyle = '#D5D5D5';
            
            // レイアウトタイプに基づいてパターンを描画
            const padding = 10;
            const gap = 4;
            const availableWidth = layoutCanvas.width - (padding * 2);
            const availableHeight = layoutCanvas.height - (padding * 2);
            
            layout.positions.forEach((pos) => {
                const x = padding + (pos.x * availableWidth);
                const y = padding + (pos.y * availableHeight);
                let width = pos.width * availableWidth;
                let height = pos.height * availableHeight;
                
                // 間隔を考慮
                if (pos.x + pos.width < 1) width -= gap;
                if (pos.y + pos.height < 1) height -= gap;
                
                layoutCtx.fillRect(x, y, width, height);
            });
            
            // 通常の画像オプションとして追加
            const img = document.createElement('img');
            img.src = layoutCanvas.toDataURL();
            img.alt = `Layout option ${index + 1}`;
            img.title = layout.type;
            img.dataset.layoutType = layout.type;
            
            img.onclick = () => {
                // すべてのオプションから選択状態を解除
                document.querySelectorAll('#layoutOptions img').forEach(image => {
                    image.style.borderColor = '#e0e0e0';
                });
                
                // 選択されたオプションを強調表示
                img.style.borderColor = '#3498db';
                
                currentLayout = layout;
                updateCollage();
            };
            
            // 現在選択されているレイアウトを強調表示
            if (currentLayout && layout.type === currentLayout.type) {
                img.style.borderColor = '#3498db';
            }
            
            layoutOptions.appendChild(img);
        });

        // 最初のレイアウトを選択
        if (layouts.length > 0) {
            currentLayout = layouts[0];
            updateCollage();
            
            // 最初のレイアウトオプションを視覚的にアクティブに
            const firstLayoutImg = document.querySelector('#layoutOptions img');
            if (firstLayoutImg) {
                firstLayoutImg.style.borderColor = '#3498db';
            }
        }

        // 画像入れ替え機能を初期化
        initImageSwapFeature();
    }

    // 画像入れ替え機能の初期化
    function initImageSwapFeature() {
        if (images.length < 2) return; // 画像が2枚以上ある場合のみ有効化

        // 既にイベントリスナーがある場合は一度削除（再初期化を防ぐため）
        mainPreview.removeEventListener('click', handleImageClick);
        document.removeEventListener('click', handleOutsideClick);
        
        // クリックイベントの追加
        mainPreview.addEventListener('click', handleImageClick);
        
        // プレビューエリア外のクリックを検知して選択解除
        document.addEventListener('click', handleOutsideClick);
    }

    // 画像クリックイベントハンドラ
    function handleImageClick(e) {
        if (images.length < 2 || currentLayout.type === 'single') return;

        // 位置調整モード中でドラッグ中の場合は画像選択を無視
        if (isAdjustMode && isDragging) {
            e.stopPropagation();
            return;
        }

        // クリック位置から画像のインデックスを取得
        const rect = mainPreview.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // クリックした位置にある画像を特定
        const imageIndex = getImageIndexAtPosition(x, y);

        if (imageIndex !== -1) {
            e.stopPropagation(); // イベントの伝播を停止
            
            if (isSwapMode) {
                // すでに別の画像が選択されている場合、入れ替えを実行
                if (selectedImageIndex !== -1 && selectedImageIndex !== imageIndex) {
                    // 画像を入れ替え
                    swapImages(selectedImageIndex, imageIndex);
                    
                    // コラージュを更新
                    updateCollage();
                    
                    // 完了メッセージ
                    showToast('Images swapped');
                }
                
                // 選択状態をリセット
                resetSelection();
            } else if (isAdjustMode) {
                // 位置調整モードがアクティブな場合
                if (selectedImageIndex !== imageIndex) {
                    // 既存の選択がある場合は前のオーバーレイを削除
                    if (selectedImageIndex !== -1) {
                        removeAdjustOverlay();
                        removeHighlight();
                    }
                    
                    // 選択画像を変更
                    selectedImageIndex = imageIndex;
                    
                    // 選択された画像をハイライト表示
                    highlightSelectedImage(imageIndex);
                    
                    // ハイライト枠を赤色に変更
                    if (highlightElement) {
                        highlightElement.style.border = '3px solid #e74c3c';
                    }
                    
                    // 入れ替えアイコンと位置調整アイコンを表示（位置調整アイコンは既にアクティブ）
                    showSwapIcon(imageIndex);
                    
                    // 現在のオフセットを更新
                    if (!imagePositionOffsets[imageIndex]) {
                        imagePositionOffsets[imageIndex] = { x: 0, y: 0 };
                    }
                    currentOffsetX = imagePositionOffsets[imageIndex].x;
                    currentOffsetY = imagePositionOffsets[imageIndex].y;
                    
                    // 新しい画像の位置に合わせてオーバーレイを再作成
                    createAdjustOverlay();
                    
                    // コラージュを更新して新しい画像の表示を反映
                    updateCollage();
                    
                    // 選択変更を通知
                    showToast('Selected another image');
                }
                // 既に選択中の画像をクリックした場合は何もしない（選択を維持）
            } else {
                // 通常モード（位置調整モードでも入れ替えモードでもない）
                // 新しく画像を選択
                selectedImageIndex = imageIndex;
                
                // 選択された画像をハイライト表示
                highlightSelectedImage(imageIndex);
                
                // 入れ替えアイコンを表示
                showSwapIcon(imageIndex);
                
                // 入れ替えモードはまだアクティブにしない（アイコンクリック時に有効化）
                isSwapMode = false;
            }
        }
    }
    
    // プレビューエリア外のクリックを処理
    function handleOutsideClick(e) {
        // mainPreviewまたはswapIconElement上のクリックは無視
        if (mainPreview.contains(e.target) || (swapIconElement && swapIconElement.contains(e.target))) {
            return;
        }
        
        // 選択状態をリセット
        resetSelection();
    }
    
    // 選択状態のリセット
    function resetSelection() {
        selectedImageIndex = -1;
        isSwapMode = false;
        isAdjustMode = false;
        removeSwapIcon();
        removeHighlight();
        // ドラッグイベントリスナーを削除
        removePositionAdjustEventListeners();
    }
    
    // 選択画像のハイライト表示
    function highlightSelectedImage(imageIndex) {
        // 既存のハイライトを削除
        removeHighlight();
        
        // プレビュー要素の親要素にposition: relativeを設定
        const previewContainer = mainPreview.parentElement;
        const originalPosition = getComputedStyle(previewContainer).position;
        if (originalPosition === 'static') {
            previewContainer.style.position = 'relative';
        }
        
        // メインプレビューの位置を取得
        const previewRect = mainPreview.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        
        // プレビュー画像の相対位置を計算
        const previewOffsetX = previewRect.left - containerRect.left;
        const previewOffsetY = previewRect.top - containerRect.top;
        
        const padding = parseInt(paddingControl.value);
        const gap = parseInt(gapControl.value);
        
        const availableWidth = mainPreview.width - (padding * 2);
        const availableHeight = mainPreview.height - (padding * 2);
        
        let highlightX, highlightY, highlightWidth, highlightHeight;
        
        // レイアウトタイプに応じたハイライト位置の計算
        if (currentLayout.type === 'vertical-2' || currentLayout.type === 'vertical-3') {
            const count = currentLayout.positions.length;
            const imgHeight = (availableHeight - ((count - 1) * gap)) / count;
            
            highlightX = previewOffsetX + padding;
            highlightY = previewOffsetY + padding + (imageIndex * (imgHeight + gap));
            highlightWidth = availableWidth;
            highlightHeight = imgHeight;
        } else if (currentLayout.type === 'horizontal-2' || currentLayout.type === 'horizontal-3') {
            const count = currentLayout.positions.length;
            const imgWidth = (availableWidth - ((count - 1) * gap)) / count;
            
            highlightX = previewOffsetX + padding + (imageIndex * (imgWidth + gap));
            highlightY = previewOffsetY + padding;
            highlightWidth = imgWidth;
            highlightHeight = availableHeight;
        } else {
            // 複合レイアウト
            if (currentLayout.type === '1-top-2-bottom') {
                if (imageIndex === 0) {
                    // 上部の画像
                    highlightX = previewOffsetX + padding;
                    highlightY = previewOffsetY + padding;
                    highlightWidth = availableWidth;
                    highlightHeight = availableHeight / 2 - gap / 2;
                } else {
                    // 下部の画像
                    const bottomWidth = (availableWidth - gap) / 2;
                    highlightX = previewOffsetX + padding + (imageIndex === 1 ? 0 : bottomWidth + gap);
                    highlightY = previewOffsetY + padding + availableHeight / 2 + gap / 2;
                    highlightWidth = bottomWidth;
                    highlightHeight = availableHeight / 2 - gap / 2;
                }
            } else if (currentLayout.type === '2-top-1-bottom') {
                if (imageIndex < 2) {
                    // 上部の画像
                    const topWidth = (availableWidth - gap) / 2;
                    highlightX = previewOffsetX + padding + (imageIndex === 0 ? 0 : topWidth + gap);
                    highlightY = previewOffsetY + padding;
                    highlightWidth = topWidth;
                    highlightHeight = availableHeight / 2 - gap / 2;
                } else {
                    // 下部の画像
                    highlightX = previewOffsetX + padding;
                    highlightY = previewOffsetY + padding + availableHeight / 2 + gap / 2;
                    highlightWidth = availableWidth;
                    highlightHeight = availableHeight / 2 - gap / 2;
                }
            } else if (currentLayout.type === '1-left-2-right') {
                if (imageIndex === 0) {
                    // 左側の画像
                    highlightX = previewOffsetX + padding;
                    highlightY = previewOffsetY + padding;
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = availableHeight;
                } else {
                    // 右側の画像
                    const rightHeight = (availableHeight - gap) / 2;
                    highlightX = previewOffsetX + padding + availableWidth / 2 + gap / 2;
                    highlightY = previewOffsetY + padding + (imageIndex === 1 ? 0 : rightHeight + gap);
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = rightHeight;
                }
            } else if (currentLayout.type === '2-left-1-right') {
                if (imageIndex < 2) {
                    // 左側の画像
                    const leftHeight = (availableHeight - gap) / 2;
                    highlightX = previewOffsetX + padding;
                    highlightY = previewOffsetY + padding + (imageIndex === 0 ? 0 : leftHeight + gap);
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = leftHeight;
                } else {
                    // 右側の画像
                    highlightX = previewOffsetX + padding + availableWidth / 2 + gap / 2;
                    highlightY = previewOffsetY + padding;
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = availableHeight;
                }
            }
        }
        
        // ハイライト要素の作成
        highlightElement = document.createElement('div');
        highlightElement.id = 'selectedImageHighlight';
        highlightElement.className = 'selected-image-highlight';
        highlightElement.style.position = 'absolute';
        highlightElement.style.left = `${highlightX}px`;
        highlightElement.style.top = `${highlightY}px`;
        highlightElement.style.width = `${highlightWidth}px`;
        highlightElement.style.height = `${highlightHeight}px`;
        highlightElement.style.border = '3px solid #3498db';
        highlightElement.style.boxSizing = 'border-box';
        highlightElement.style.pointerEvents = 'none'; // クリックイベントを通過させる
        highlightElement.style.zIndex = '5'; // 最前面ではなく適度なz-index
        
        // mainPreviewではなく親要素に追加
        previewContainer.appendChild(highlightElement);
        
        // スクロールイベントのリスナーを追加
        previewContainer.addEventListener('scroll', updateHighlightPosition);
        window.addEventListener('resize', updateHighlightPosition);
    }
    
    // ハイライトの位置を更新
    function updateHighlightPosition() {
        if (!highlightElement || selectedImageIndex === -1) return;
        
        // swapIconの位置も更新
        if (swapIconElement) {
            updateSwapIconPosition();
        }
    }
    
    // ハイライトの削除
    function removeHighlight() {
        const highlight = document.getElementById('selectedImageHighlight');
        if (highlight) {
            highlight.remove();
        }
        
        // スクロールイベントのリスナーを削除
        const previewContainer = mainPreview.parentElement;
        previewContainer.removeEventListener('scroll', updateHighlightPosition);
        window.removeEventListener('resize', updateHighlightPosition);
        
        highlightElement = null;
    }
    
    // 入れ替えアイコンの表示
    function showSwapIcon(imageIndex) {
        // 既存のアイコンを削除
        removeSwapIcon();
        
        if (imageIndex === -1) return;
        
        const previewContainer = mainPreview.parentElement;
        
        // アイコンコンテナを作成（両方のアイコンをまとめるための要素）
        const iconContainer = document.createElement('div');
        iconContainer.id = 'iconContainer';
        iconContainer.style.position = 'absolute';
        iconContainer.style.background = '#222';
        iconContainer.style.boxShadow = '0 .125em .25em rgba(0,0,0,.25)';
        iconContainer.style.borderRadius = '.25em';
        iconContainer.style.display = 'flex';
        iconContainer.style.zIndex = '10';
        iconContainer.style.padding = '2px';
        
        // 入れ替えアイコンを作成
        swapIconElement = document.createElement('div');
        swapIconElement.id = 'swapIcon';
        swapIconElement.innerHTML = '<i class="fas fa-exchange-alt"></i>';
        swapIconElement.style.width = '30px';
        swapIconElement.style.height = '30px';
        swapIconElement.style.color = 'white';
        swapIconElement.style.display = 'flex';
        swapIconElement.style.justifyContent = 'center';
        swapIconElement.style.alignItems = 'center';
        swapIconElement.style.cursor = 'pointer';
        swapIconElement.style.margin = '0 3px';
        
        // 位置調整アイコンを作成
        positionAdjustElement = document.createElement('div');
        positionAdjustElement.id = 'positionAdjustIcon';
        positionAdjustElement.innerHTML = '<i class="fas fa-arrows-alt"></i>';
        positionAdjustElement.style.width = '30px';
        positionAdjustElement.style.height = '30px';
        positionAdjustElement.style.color = 'white';
        positionAdjustElement.style.display = 'flex';
        positionAdjustElement.style.justifyContent = 'center';
        positionAdjustElement.style.alignItems = 'center';
        positionAdjustElement.style.cursor = 'pointer';
        positionAdjustElement.style.margin = '0 3px';
        
        // 入れ替えアイコンのクリックイベント
        swapIconElement.addEventListener('click', (e) => {
            e.stopPropagation(); // イベントの伝播を停止
            
            // 入れ替えモードのトグル
            isSwapMode = !isSwapMode;
            
            if (isSwapMode) {
                // 入れ替えモードがアクティブになったら
                showToast('Click another image to swap positions');
                
                // 位置調整モードがアクティブだった場合はオフにする
                if (isAdjustMode) {
                    isAdjustMode = false;
                    
                    // ハイライト枠を通常の青色に戻す
                    if (highlightElement) {
                        highlightElement.style.border = '3px solid #3498db';
                    }
                    
                    removePositionAdjustEventListeners();
                    removeAdjustOverlay();
                }
            } else {
                // 入れ替えモードが非アクティブになったら
            }
        });
        
        // 位置調整アイコンのクリックイベント
        positionAdjustElement.addEventListener('click', (e) => {
            e.stopPropagation(); // イベントの伝播を停止
            
            // 位置調整モード状態のトグル
            isAdjustMode = !isAdjustMode;
            
            if (isAdjustMode) {
                // 位置調整モードがアクティブになったら
                showToast('Drag to adjust image position');
                
                // 入れ替えモードはオフにする
                isSwapMode = false;
                
                // 現在の画像のオフセットを取得または初期化
                if (!imagePositionOffsets[selectedImageIndex]) {
                    imagePositionOffsets[selectedImageIndex] = { x: 0, y: 0 };
                }
                
                // 現在のオフセットを保存
                currentOffsetX = imagePositionOffsets[selectedImageIndex].x;
                currentOffsetY = imagePositionOffsets[selectedImageIndex].y;
                
                // ドラッグイベントリスナーを設定
                setupPositionAdjustEventListeners();
                
                // 位置調整モード用の表示に更新
                updateAdjustModeView();
            } else {
                
                // ハイライト枠を削除（通常の青色枠に戻す）
                if (highlightElement) {
                    highlightElement.style.border = '3px solid #3498db';
                }
                
                // ドラッグイベントリスナーを削除
                removePositionAdjustEventListeners();
                
                // オーバーレイを削除
                removeAdjustOverlay();
                
                // 位置調整モード終了を通知
                showToast('Position adjustment mode ended');
            }
        });
        
        // アイコンをコンテナに追加
        iconContainer.appendChild(swapIconElement);
        iconContainer.appendChild(positionAdjustElement);
        
        // コンテナをpreviewContainerに追加
        previewContainer.appendChild(iconContainer);
        
        // スクロールイベントのリスナーを追加
        previewContainer.addEventListener('scroll', updateSwapIconPosition);
        window.addEventListener('resize', updateSwapIconPosition);
        
        // アイコン位置を更新
        updateSwapIconPosition();
    }
    
    // 入れ替えアイコンの位置を更新
    function updateSwapIconPosition() {
        if (!swapIconElement || !positionAdjustElement || selectedImageIndex === -1) return;
        
        const iconContainer = document.getElementById('iconContainer');
        if (!iconContainer) return;
        
        // メインプレビューの位置を取得
        const previewContainer = mainPreview.parentElement;
        const previewRect = mainPreview.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        
        // プレビュー画像の相対位置を計算
        const previewOffsetX = previewRect.left - containerRect.left;
        const previewOffsetY = previewRect.top - containerRect.top;
        
        // アイコンの位置を再計算して更新
        const padding = parseInt(paddingControl.value);
        const gap = parseInt(gapControl.value);
        
        const availableWidth = mainPreview.width - (padding * 2);
        const availableHeight = mainPreview.height - (padding * 2);
        
        let iconX, iconY;
        const imageIndex = selectedImageIndex;
        
        // レイアウトタイプに応じたアイコン位置の再計算
        if (currentLayout.type === 'vertical-2' || currentLayout.type === 'vertical-3') {
            const count = currentLayout.positions.length;
            const imgHeight = (availableHeight - ((count - 1) * gap)) / count;
            
            iconX = previewOffsetX + padding + availableWidth / 2;
            iconY = previewOffsetY + padding + (imageIndex * (imgHeight + gap)) + imgHeight / 2;
        } else if (currentLayout.type === 'horizontal-2' || currentLayout.type === 'horizontal-3') {
            const count = currentLayout.positions.length;
            const imgWidth = (availableWidth - ((count - 1) * gap)) / count;
            
            iconX = previewOffsetX + padding + (imageIndex * (imgWidth + gap)) + imgWidth / 2;
            iconY = previewOffsetY + padding + availableHeight / 2;
        } else {
            // 複合レイアウト（各ケースに対応）
            if (currentLayout.type === '1-top-2-bottom') {
                if (imageIndex === 0) {
                    // 上部の画像
                    iconX = previewOffsetX + padding + availableWidth / 2;
                    iconY = previewOffsetY + padding + (availableHeight / 2 - gap / 2) / 2;
                } else {
                    // 下部の画像
                    const bottomWidth = (availableWidth - gap) / 2;
                    iconX = previewOffsetX + padding + (imageIndex === 1 ? bottomWidth / 2 : bottomWidth + gap + bottomWidth / 2);
                    iconY = previewOffsetY + padding + availableHeight / 2 + gap / 2 + (availableHeight / 2 - gap / 2) / 2;
                }
            } else if (currentLayout.type === '2-top-1-bottom') {
                if (imageIndex < 2) {
                    // 上部の画像
                    const topWidth = (availableWidth - gap) / 2;
                    iconX = previewOffsetX + padding + (imageIndex === 0 ? topWidth / 2 : topWidth + gap + topWidth / 2);
                    iconY = previewOffsetY + padding + (availableHeight / 2 - gap / 2) / 2;
                } else {
                    // 下部の画像
                    iconX = previewOffsetX + padding + availableWidth / 2;
                    iconY = previewOffsetY + padding + availableHeight / 2 + gap / 2 + (availableHeight / 2 - gap / 2) / 2;
                }
            } else if (currentLayout.type === '1-left-2-right') {
                if (imageIndex === 0) {
                    // 左側の画像
                    iconX = previewOffsetX + padding + (availableWidth / 2 - gap / 2) / 2;
                    iconY = previewOffsetY + padding + availableHeight / 2;
                } else {
                    // 右側の画像
                    const rightHeight = (availableHeight - gap) / 2;
                    iconX = previewOffsetX + padding + availableWidth / 2 + gap / 2 + (availableWidth / 2 - gap / 2) / 2;
                    iconY = previewOffsetY + padding + (imageIndex === 1 ? rightHeight / 2 : rightHeight + gap + rightHeight / 2);
                }
            } else if (currentLayout.type === '2-left-1-right') {
                if (imageIndex < 2) {
                    // 左側の画像
                    const leftHeight = (availableHeight - gap) / 2;
                    highlightX = previewOffsetX + padding;
                    highlightY = previewOffsetY + padding + (imageIndex === 0 ? 0 : leftHeight + gap);
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = leftHeight;
                } else {
                    // 右側の画像
                    highlightX = previewOffsetX + padding + availableWidth / 2 + gap / 2;
                    highlightY = previewOffsetY + padding;
                    highlightWidth = availableWidth / 2 - gap / 2;
                    highlightHeight = availableHeight;
                }
            }
        }
        
        // アイコンコンテナの位置を更新
        iconContainer.style.left = `${iconX - 35}px`;
        iconContainer.style.top = `${iconY - 15}px`;
    }
    
    // 入れ替えアイコンと位置調整アイコンの削除
    function removeSwapIcon() {
        const iconContainer = document.getElementById('iconContainer');
        if (iconContainer) {
            iconContainer.remove();
        }
        
        // スクロールイベントのリスナーを削除
        const previewContainer = mainPreview.parentElement;
        previewContainer.removeEventListener('scroll', updateSwapIconPosition);
        window.removeEventListener('resize', updateSwapIconPosition);
        
        swapIconElement = null;
        positionAdjustElement = null;
    }

    // 画像入れ替え
    function swapImages(index1, index2) {
        if (index1 === index2 || index1 < 0 || index2 < 0 || index1 >= images.length || index2 >= images.length) {
            return;
        }
        
        // 画像の入れ替え
        const temp = images[index1];
        images[index1] = images[index2];
        images[index2] = temp;
    }

    // クリック位置に対応する画像のインデックスを取得
    function getImageIndexAtPosition(x, y) {
        if (!currentLayout || images.length < 2) return -1;
        
        const padding = parseInt(paddingControl.value);
        const gap = parseInt(gapControl.value);
        
        const availableWidth = mainPreview.width - (padding * 2);
        const availableHeight = mainPreview.height - (padding * 2);
        
        // レイアウトタイプに応じた座標計算
        if (currentLayout.type === 'vertical-2' || currentLayout.type === 'vertical-3') {
            // 垂直レイアウト
            const count = currentLayout.positions.length;
            const imgHeight = (availableHeight - ((count - 1) * gap)) / count;
            
            for (let i = 0; i < count && i < images.length; i++) {
                const top = padding + (i * (imgHeight + gap));
                const bottom = top + imgHeight;
                
                if (y >= top && y <= bottom) {
                    return i;
                }
            }
        } else if (currentLayout.type === 'horizontal-2' || currentLayout.type === 'horizontal-3') {
            // 水平レイアウト
            const count = currentLayout.positions.length;
            const imgWidth = (availableWidth - ((count - 1) * gap)) / count;
            
            for (let i = 0; i < count && i < images.length; i++) {
                const left = padding + (i * (imgWidth + gap));
                const right = left + imgWidth;
                
                if (x >= left && x <= right) {
                    return i;
                }
            }
        } else {
            // 複合レイアウト
            for (let i = 0; i < currentLayout.positions.length && i < images.length; i++) {
                const pos = currentLayout.positions[i];
                
                // 画像の領域を計算
                let imgX, imgY, imgWidth, imgHeight;
                
                if (currentLayout.type === '1-top-2-bottom') {
                    if (i === 0) {
                        // 上部の画像
                        imgX = padding;
                        imgY = padding;
                        imgWidth = availableWidth;
                        imgHeight = availableHeight / 2 - gap / 2;
                    } else {
                        // 下部の画像
                        const bottomWidth = (availableWidth - gap) / 2;
                        imgX = padding + (i === 1 ? 0 : bottomWidth + gap);
                        imgY = padding + availableHeight / 2 + gap / 2;
                        imgWidth = bottomWidth;
                        imgHeight = availableHeight / 2 - gap / 2;
                    }
                } else if (currentLayout.type === '2-top-1-bottom') {
                    if (i < 2) {
                        // 上部の画像
                        const topWidth = (availableWidth - gap) / 2;
                        imgX = padding + (i === 0 ? 0 : topWidth + gap);
                        imgY = padding;
                        imgWidth = topWidth;
                        imgHeight = availableHeight / 2 - gap / 2;
                    } else {
                        // 下部の画像
                        imgX = padding;
                        imgY = padding + availableHeight / 2 + gap / 2;
                        imgWidth = availableWidth;
                        imgHeight = availableHeight / 2 - gap / 2;
                    }
                } else if (currentLayout.type === '1-left-2-right') {
                    if (i === 0) {
                        // 左側の画像
                        imgX = padding;
                        imgY = padding;
                        imgWidth = availableWidth / 2 - gap / 2;
                        imgHeight = availableHeight;
                    } else {
                        // 右側の画像
                        const rightHeight = (availableHeight - gap) / 2;
                        imgX = padding + availableWidth / 2 + gap / 2;
                        imgY = padding + (i === 1 ? 0 : rightHeight + gap);
                        imgWidth = availableWidth / 2 - gap / 2;
                        imgHeight = rightHeight;
                    }
                } else if (currentLayout.type === '2-left-1-right') {
                    if (i < 2) {
                        // 左側の画像
                        const leftHeight = (availableHeight - gap) / 2;
                        imgX = padding;
                        imgY = padding + (i === 0 ? 0 : leftHeight + gap);
                        imgWidth = availableWidth / 2 - gap / 2;
                        imgHeight = leftHeight;
                    } else {
                        // 右側の画像
                        imgX = padding + availableWidth / 2 + gap / 2;
                        imgY = padding;
                        imgWidth = availableWidth / 2 - gap / 2;
                        imgHeight = availableHeight;
                    }
                }
                
                // 座標が画像の領域内かチェック
                if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
                    return i;
                }
            }
        }
        
        return -1;
    }

    // レイアウトパターンの生成
    function generateLayouts() {
        const layouts = [];
        
        if (images.length === 1) {
            // 1枚の場合は全画面表示
            layouts.push({
                type: 'single',
                positions: [
                    { x: 0, y: 0, width: 1, height: 1 }
                ]
            });
        } else if (images.length === 2) {
            // 2枚のレイアウト
            layouts.push({
                type: 'vertical-2',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: 'horizontal-2',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        } else if (images.length === 3) {
            // 3枚のレイアウト
            layouts.push({
                type: 'vertical-3',
                positions: [
                    { x: 0, y: 0, width: 1, height: 1/3 },
                    { x: 0, y: 1/3, width: 1, height: 1/3 },
                    { x: 0, y: 2/3, width: 1, height: 1/3 }
                ]
            });
            layouts.push({
                type: 'horizontal-3',
                positions: [
                    { x: 0, y: 0, width: 1/3, height: 1 },
                    { x: 1/3, y: 0, width: 1/3, height: 1 },
                    { x: 2/3, y: 0, width: 1/3, height: 1 }
                ]
            });
            layouts.push({
                type: '1-top-2-bottom',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-top-1-bottom',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: '1-left-2-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-left-1-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        }

        return layouts;
    }

    // レイアウトの描画
    function drawLayout(canvas, ctx, layout) {
        let canvasWidth, canvasHeight;
        
        if (customWidth > 0 && customHeight > 0) {
            // カスタムサイズ（SNS用）が指定されている場合
            const scale = 600 / Math.max(customWidth, customHeight); // 表示サイズに合わせてスケール
            canvasWidth = customWidth * scale;
            canvasHeight = customHeight * scale;
        } else {
            // 通常のアスペクト比を使用
            const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
            canvasWidth = 600;
            canvasHeight = 600 * (heightRatio / widthRatio);
        }
        
        // キャンバスのサイズを設定
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        const padding = parseInt(paddingControl.value); // 外側余白
        const gap = parseInt(gapControl.value); // 写真間隔
        const bgColor = bgColorControl.value;

        // 背景の描画
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // レイアウトに基づいて描画方法を選択
        if (layout.type === 'single') {
            // 1枚の場合はシンプルに画像を描画
            if (images[0]) {
                const x = padding;
                const y = padding;
                const width = canvas.width - (padding * 2);
                const height = canvas.height - (padding * 2);
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[0], x, y, width, height);
            }
        } else if (layout.type === 'vertical-2' || layout.type === 'vertical-3') {
            drawVerticalLayout(canvas, ctx, layout, padding, gap, bgColor);
        } else if (layout.type === 'horizontal-2' || layout.type === 'horizontal-3') {
            drawHorizontalLayout(canvas, ctx, layout, padding, gap, bgColor);
        } else {
            drawComplexLayout(canvas, ctx, layout, padding, gap, bgColor);
        }
    }

    // 垂直レイアウト（上下に並べる）の描画
    function drawVerticalLayout(canvas, ctx, layout, padding, gap, bgColor) {
        const count = layout.positions.length; // 画像の数
        
        // 利用可能な描画領域
        const totalHeight = canvas.height - (padding * 2) - (gap * (count - 1)); // 合計の高さから全ての余白を引く
        const singleHeight = totalHeight / count; // 1枚あたりの高さ
        const width = canvas.width - (padding * 2); // 幅は左右の余白を引いたもの
        
        // 各画像を描画
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                const x = padding;
                const y = padding + (index * (singleHeight + gap));
                
                // 位置オフセットの適用
                const offset = imagePositionOffsets[index] || { x: 0, y: 0 };
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, width, singleHeight, offset);
            }
        });
    }
    
    // 水平レイアウト（左右に並べる）の描画
    function drawHorizontalLayout(canvas, ctx, layout, padding, gap, bgColor) {
        const count = layout.positions.length; // 画像の数
        
        // 利用可能な描画領域
        const totalWidth = canvas.width - (padding * 2) - (gap * (count - 1)); // 合計の幅から全ての余白を引く
        const singleWidth = totalWidth / count; // 1枚あたりの幅
        const height = canvas.height - (padding * 2); // 高さは上下の余白を引いたもの
        
        // 各画像を描画
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                const x = padding + (index * (singleWidth + gap));
                const y = padding;
                
                // 位置オフセットの適用
                const offset = imagePositionOffsets[index] || { x: 0, y: 0 };
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, singleWidth, height, offset);
            }
        });
    }
    
    // 複合レイアウトの描画
    function drawComplexLayout(canvas, ctx, layout, padding, gap, bgColor) {
        // 利用可能な描画領域
        const availableWidth = canvas.width - (padding * 2);
        const availableHeight = canvas.height - (padding * 2);
        
        // 中央の余白を考慮した実際の描画位置と大きさを計算
        layout.positions.forEach((pos, index) => {
            if (images[index]) {
                let x, y, width, height;
                
                if (layout.type === '1-top-2-bottom') {
                    if (index === 0) { // 上部の大きい画像
                        x = padding;
                        y = padding;
                        width = availableWidth;
                        height = (availableHeight - gap) / 2;
                    } else { // 下部の2枚
                        const bottomWidth = (availableWidth - gap) / 2;
                        x = padding + (index === 1 ? 0 : bottomWidth + gap);
                        y = padding + (availableHeight + gap) / 2;
                        width = bottomWidth;
                        height = (availableHeight - gap) / 2;
                    }
                } else if (layout.type === '2-top-1-bottom') {
                    if (index < 2) { // 上部の2枚
                        const topWidth = (availableWidth - gap) / 2;
                        x = padding + (index === 0 ? 0 : topWidth + gap);
                        y = padding;
                        width = topWidth;
                        height = (availableHeight - gap) / 2;
                    } else { // 下部の大きい画像
                        x = padding;
                        y = padding + (availableHeight + gap) / 2;
                        width = availableWidth;
                        height = (availableHeight - gap) / 2;
                    }
                } else if (layout.type === '1-left-2-right') {
                    if (index === 0) { // 左側の大きい画像
                        x = padding;
                        y = padding;
                        width = (availableWidth - gap) / 2;
                        height = availableHeight;
                    } else { // 右側の2枚
                        const rightHeight = (availableHeight - gap) / 2;
                        x = padding + (availableWidth + gap) / 2;
                        y = padding + (index === 1 ? 0 : rightHeight + gap);
                        width = (availableWidth - gap) / 2;
                        height = rightHeight;
                    }
                } else if (layout.type === '2-left-1-right') {
                    if (index < 2) { // 左側の2枚
                        const leftHeight = (availableHeight - gap) / 2;
                        x = padding;
                        y = padding + (index === 0 ? 0 : leftHeight + gap);
                        width = (availableWidth - gap) / 2;
                        height = leftHeight;
                    } else { // 右側の大きい画像
                        x = padding + (availableWidth + gap) / 2;
                        y = padding;
                        width = (availableWidth - gap) / 2;
                        height = availableHeight;
                    }
                }
                
                // 位置オフセットの適用
                const offset = imagePositionOffsets[index] || { x: 0, y: 0 };
                
                // 画像をクロップして描画
                drawImageCovered(ctx, images[index], x, y, width, height, offset);
            }
        });
    }

    // object-fit: cover と同様に画像を描画する関数
    function drawImageCovered(ctx, img, x, y, width, height, offset = { x: 0, y: 0 }) {
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;
        
        let sw, sh, sx, sy;
        
        if (imgRatio > boxRatio) { // 画像が横長の場合
            sh = img.height;
            sw = sh * boxRatio;
            // 位置オフセットを適用（横方向）
            sx = (img.width - sw) / 2 + (offset.x / 100) * (img.width - sw);
            sy = 0 + (offset.y / 100) * (img.height - sh);
        } else { // 画像が縦長の場合
            sw = img.width;
            sh = sw / boxRatio;
            // 位置オフセットを適用（縦方向）
            sx = 0 + (offset.x / 100) * (img.width - sw);
            sy = (img.height - sh) / 2 + (offset.y / 100) * (img.height - sh);
        }
        
        // オフセット値が画像の範囲内に収まるように制限
        sx = Math.max(0, Math.min(sx, img.width - sw));
        sy = Math.max(0, Math.min(sy, img.height - sh));
        
        // 角丸の半径
        const cornerRadius = parseInt(cornerRadiusControl.value);
        
        if (cornerRadius > 0) {
            // 角丸のある矩形パスを作成
            ctx.save();
            ctx.beginPath();
            // 左上角
            ctx.moveTo(x + cornerRadius, y);
            // 上辺
            ctx.lineTo(x + width - cornerRadius, y);
            // 右上角
            ctx.arc(x + width - cornerRadius, y + cornerRadius, cornerRadius, Math.PI * 1.5, 0, false);
            // 右辺
            ctx.lineTo(x + width, y + height - cornerRadius);
            // 右下角
            ctx.arc(x + width - cornerRadius, y + height - cornerRadius, cornerRadius, 0, Math.PI * 0.5, false);
            // 下辺
            ctx.lineTo(x + cornerRadius, y + height);
            // 左下角
            ctx.arc(x + cornerRadius, y + height - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI, false);
            // 左辺
            ctx.lineTo(x, y + cornerRadius);
            // 左上角
            ctx.arc(x + cornerRadius, y + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5, false);
            ctx.closePath();
            
            // クリッピングパスを設定
            ctx.clip();
            
            // 画像を描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
            
            ctx.restore();
        } else {
            // 角丸なしで普通に描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        }
    }

    // コントロールのイベントハンドラ
    paddingControl.addEventListener('input', updateCollage);
    bgColorControl.addEventListener('input', updateCollage);

    function updateCollage() {
        // レイアウト情報が存在しない場合や画像が選択されていない場合は何もしない
        if (!currentLayout || images.length === 0) {
            mainPreview.style.display = 'none';
            return;
        }
        
        // キャンバスのクリア
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 描画処理を行う
        drawLayout(canvas, ctx, currentLayout);
        
        mainPreview.src = canvas.toDataURL();
        mainPreview.style.display = 'block';
        
        // 位置調整中は選択状態を維持
        if (selectedImageIndex !== -1) {
            highlightSelectedImage(selectedImageIndex);
            showSwapIcon(selectedImageIndex);

            // 位置調整モード中は枠線の色を維持
            if (isAdjustMode && highlightElement) {
                highlightElement.style.borderColor = 'rgb(231, 76, 60)'; // 赤色を維持
            }
        }
        
        resetZoom();
    }

    // レイアウトオプションを現在のアスペクト比で更新
    function updateLayoutOptions() {
        if (images.length < 1) return; // 1枚以上あれば処理を続行
        
        const layouts = generateLayouts();
        layoutOptions.innerHTML = '';
        
        layouts.forEach((layout, index) => {
            // レイアウトパターンを描画するためのキャンバスを作成
            const layoutCanvas = document.createElement('canvas');
            const layoutCtx = layoutCanvas.getContext('2d');
            layoutCanvas.width = 100;
            layoutCanvas.height = 100;
            
            // パターン背景を描画
            layoutCtx.fillStyle = '#f3f4f6';
            layoutCtx.fillRect(0, 0, layoutCanvas.width, layoutCanvas.height);
            
            // レイアウト枠を描画
            layoutCtx.fillStyle = '#D5D5D5';
            
            // レイアウトタイプに基づいてパターンを描画
            const padding = 10;
            const gap = 4;
            const availableWidth = layoutCanvas.width - (padding * 2);
            const availableHeight = layoutCanvas.height - (padding * 2);
            
            layout.positions.forEach((pos) => {
                const x = padding + (pos.x * availableWidth);
                const y = padding + (pos.y * availableHeight);
                let width = pos.width * availableWidth;
                let height = pos.height * availableHeight;
                
                // 間隔を考慮
                if (pos.x + pos.width < 1) width -= gap;
                if (pos.y + pos.height < 1) height -= gap;
                
                layoutCtx.fillRect(x, y, width, height);
            });
            
            const img = document.createElement('img');
            img.src = layoutCanvas.toDataURL();
            img.alt = `Layout option ${index + 1}`;
            img.title = layout.type;
            img.dataset.layoutType = layout.type;
            
            // クリックイベント
            img.onclick = () => {
                // すべてのオプションから選択状態を解除
                document.querySelectorAll('#layoutOptions img').forEach(image => {
                    image.style.borderColor = '#e0e0e0';
                });
                
                // 選択されたオプションを強調表示
                img.style.borderColor = '#3498db';
                
                currentLayout = layout;
                updateCollage();
            };
            
            // 現在選択されているレイアウトを強調表示
            if (currentLayout && layout.type === currentLayout.type) {
                img.style.borderColor = '#3498db';
            }
            
            layoutOptions.appendChild(img);
        });
    }

    // リセットボタン
    resetButton.addEventListener('click', () => {
        aspectRatioButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('.aspect-ratio-btn[data-ratio="1:1"]').classList.add('active');
        currentAspectRatio = '1:1';
        customWidth = 0;
        customHeight = 0;
        paddingControl.value = 10;
        paddingNumberInput.value = 10;
        gapControl.value = 10;
        gapNumberInput.value = 10;
        cornerRadiusControl.value = 0;
        cornerRadiusNumberInput.value = 0;
        bgColorControl.value = '#ffffff';
        colorPreview.style.backgroundColor = '#ffffff';
        colorPresets.forEach(p => p.classList.remove('active'));
        document.querySelector('.color-preset[data-color="#ffffff"]').classList.add('active');
        
        // SNSボタンのactive状態をリセット
        socialMediaButtons.forEach(btn => btn.classList.remove('active'));
        
        updateCollage();
    });

    // ダウンロードボタン
    downloadButton.addEventListener('click', () => {
        if (mainPreview.src) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let outputWidth, outputHeight;
            
            // カスタムサイズが指定されている場合はそれを使用、
            // 指定されていない場合は幅1080pxをベースにアスペクト比に応じたサイズを計算
            if (customWidth > 0 && customHeight > 0) {
                outputWidth = customWidth;
                outputHeight = customHeight;
            } else {
                const [widthRatio, heightRatio] = currentAspectRatio.split(':').map(Number);
                outputWidth = 1080; // デフォルト幅を1080pxに固定
                outputHeight = Math.round(1080 * (heightRatio / widthRatio));
            }
            
            // キャンバスのサイズを設定
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // 背景色
            ctx.fillStyle = bgColorControl.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const padding = parseInt(paddingControl.value) * (outputWidth / 500); // 500pxのプレビューからの比率で計算
            const gap = parseInt(gapControl.value) * (outputWidth / 500);
            const cornerRadius = parseInt(cornerRadiusControl.value) * (outputWidth / 500);
            
            // レイアウトに応じて画像を描画
            if (currentLayout) {
                // 1枚の画像の場合はsingleレイアウト
                if (currentLayout.type === 'single' && images[0]) {
                    const x = padding;
                    const y = padding;
                    const width = canvas.width - (padding * 2);
                    const height = canvas.height - (padding * 2);
                    
                    // 画像を描画（角丸対応）
                    drawImageWithCorners(ctx, images[0], x, y, width, height, cornerRadius);
                } else {
                    // 複数画像のレイアウト
                    const availableWidth = canvas.width - (padding * 2);
                    const availableHeight = canvas.height - (padding * 2);
                    
                    currentLayout.positions.forEach((pos, index) => {
                        if (images[index]) {
                            const x = padding + (pos.x * availableWidth);
                            const y = padding + (pos.y * availableHeight);
                            const width = pos.width * availableWidth;
                            const height = pos.height * availableHeight;
                            
                            // 間隔を考慮
                            let adjustedWidth = width;
                            let adjustedHeight = height;
                            
                            if (pos.x + pos.width < 1) adjustedWidth -= gap;
                            if (pos.y + pos.height < 1) adjustedHeight -= gap;
                            
                            // 画像を描画（角丸対応）
                            drawImageWithCorners(ctx, images[index], x, y, adjustedWidth, adjustedHeight, cornerRadius);
                        }
                    });
                }
            }
            
            // ダウンロード
            const link = document.createElement('a');
            const filename = customWidth > 0 && customHeight > 0 
                ? `collage_${outputWidth}x${outputHeight}.png` 
                : `collage_${outputWidth}x${outputHeight}_${currentAspectRatio.replace(':', 'to')}.png`;
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    });
    
    // 角丸付きで画像を描画する関数（ダウンロード用）
    function drawImageWithCorners(ctx, img, x, y, width, height, cornerRadius) {
        const imgRatio = img.width / img.height;
        const boxRatio = width / height;
        
        let sw, sh, sx, sy;
        
        // 位置オフセットの適用
        const offset = imagePositionOffsets[images.indexOf(img)] || { x: 0, y: 0 };
        
        if (imgRatio > boxRatio) { // 画像が横長の場合
            sh = img.height;
            sw = sh * boxRatio;
            // 位置オフセットを適用（横方向）
            sx = (img.width - sw) / 2 + (offset.x / 100) * (img.width - sw);
            sy = 0 + (offset.y / 100) * (img.height - sh);
        } else { // 画像が縦長の場合
            sw = img.width;
            sh = sw / boxRatio;
            // 位置オフセットを適用（縦方向）
            sx = 0 + (offset.x / 100) * (img.width - sw);
            sy = (img.height - sh) / 2 + (offset.y / 100) * (img.height - sh);
        }
        
        // オフセット値が画像の範囲内に収まるように制限
        sx = Math.max(0, Math.min(sx, img.width - sw));
        sy = Math.max(0, Math.min(sy, img.height - sh));
        
        if (cornerRadius > 0) {
            // 角丸のある矩形パスを作成
            ctx.save();
            ctx.beginPath();
            // 左上角
            ctx.moveTo(x + cornerRadius, y);
            // 上辺
            ctx.lineTo(x + width - cornerRadius, y);
            // 右上角
            ctx.arc(x + width - cornerRadius, y + cornerRadius, cornerRadius, Math.PI * 1.5, 0, false);
            // 右辺
            ctx.lineTo(x + width, y + height - cornerRadius);
            // 右下角
            ctx.arc(x + width - cornerRadius, y + height - cornerRadius, cornerRadius, 0, Math.PI * 0.5, false);
            // 下辺
            ctx.lineTo(x + cornerRadius, y + height);
            // 左下角
            ctx.arc(x + cornerRadius, y + height - cornerRadius, cornerRadius, Math.PI * 0.5, Math.PI, false);
            // 左辺
            ctx.lineTo(x, y + cornerRadius);
            // 左上角
            ctx.arc(x + cornerRadius, y + cornerRadius, cornerRadius, Math.PI, Math.PI * 1.5, false);
            ctx.closePath();
            
            // クリッピングパスを設定
            ctx.clip();
            
            // 画像を描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
            
            ctx.restore();
        } else {
            // 角丸なしで普通に描画
            ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
        }
    }

    // ズームイン・アウトボタンのイベントリスナー
    zoomInBtn.addEventListener('click', () => {
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // ズームイン: 10%ずつ拡大（最大200%まで）
        currentZoom = Math.min(currentZoom + 10, 200);
        
        // セレクトボックスの値を更新
        updateZoomSelect();
        
        // ズームレベルを適用
        applyZoom();
    });
    
    zoomOutBtn.addEventListener('click', () => {
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // ズームアウト: 10%ずつ縮小（最小30%まで）
        currentZoom = Math.max(currentZoom - 10, 30);
        
        // セレクトボックスの値を更新
        updateZoomSelect();
        
        // ズームレベルを適用
        applyZoom();
    });

    // ズームセレクトのイベントリスナー
    zoomSelect.addEventListener('change', () => {
        const value = zoomSelect.value;
        
        // 元のサイズがまだ保存されていない場合に保存
        if (originalWidth === 0 && mainPreview.naturalWidth > 0) {
            originalWidth = mainPreview.naturalWidth;
            originalHeight = mainPreview.naturalHeight;
        }
        
        // 選択された値に基づいてズームレベルを設定
        currentZoom = parseInt(value);
        
        // ズームレベルを適用
        applyZoom();
    });

    // ズームレベルをプレビュー画像に適用
    function applyZoom() {
        if (mainPreview.src) {
            const previewContainer = document.querySelector('.preview-container');

            if (currentZoom === 100) {
                // 100%の場合は元のスタイルに戻す
                mainPreview.style.width = '';
                mainPreview.style.height = '';
                mainPreview.style.maxWidth = '100%';
                mainPreview.style.maxHeight = '100%';
                previewContainer.scrollTop = 0;
                previewContainer.scrollLeft = 0;
            } else {
                // まず100%状態に戻して基準サイズを取得
                mainPreview.style.width = '';
                mainPreview.style.height = '';
                mainPreview.style.maxWidth = '100%';
                mainPreview.style.maxHeight = '100%';
                
                // 基準サイズを取得
                const baseWidth = mainPreview.offsetWidth || mainPreview.naturalWidth;
                const baseHeight = mainPreview.offsetHeight || mainPreview.naturalHeight;
                
                // スケールファクターを適用
                const scaleFactor = currentZoom / 100;
                mainPreview.style.width = `${baseWidth * scaleFactor}px`;
                mainPreview.style.height = `${baseHeight * scaleFactor}px`;
                
                // 拡大時のみmax制限を解除
                if (currentZoom > 100) {
                    mainPreview.style.maxWidth = 'none';
                    mainPreview.style.maxHeight = 'none';
                }
                
                // スクロール位置を調整
                previewContainer.scrollTop = 0;
                previewContainer.scrollLeft = 0;
                const scrollX = (mainPreview.offsetWidth - previewContainer.clientWidth) / 2;
                const scrollY = (mainPreview.offsetHeight - previewContainer.clientHeight) / 2;
                if (scrollX > 0) previewContainer.scrollLeft = scrollX;
                if (scrollY > 0) previewContainer.scrollTop = scrollY;
            }
        }
    }
    
    // セレクトボックスの値を現在のズームレベルに合わせて更新
    function updateZoomSelect() {
        // 現在のズームに一致する値があれば選択
        if ([50, 100, 150, 200].includes(currentZoom)) {
            zoomSelect.value = currentZoom.toString();
        } else {
            // カスタムオプションの追加・更新
            let customOption = null;
            
            // 既存のカスタムオプションを確認
            for (let i = 0; i < zoomSelect.options.length; i++) {
                if (zoomSelect.options[i].value === 'custom') {
                    customOption = zoomSelect.options[i];
                    break;
                }
            }
            
            // カスタムオプションがなければ作成
            if (!customOption) {
                customOption = document.createElement('option');
                customOption.value = 'custom';
                zoomSelect.appendChild(customOption);
            }
            
            // カスタムオプションを更新して選択
            customOption.textContent = `${currentZoom}%`;
            zoomSelect.value = 'custom';
        }
    }

    // ズームレベルをリセット
    function resetZoom() {
        currentZoom = 100;
        originalWidth = 0;
        originalHeight = 0;
        if (mainPreview) {
            mainPreview.style.width = '';
            mainPreview.style.height = '';
            mainPreview.style.maxWidth = '100%';
            mainPreview.style.maxHeight = '100%';
        }
        
        // セレクトボックスも100%に戻す
        zoomSelect.value = '100';
        
        // カスタムオプションが存在すれば削除
        const customOption = zoomSelect.querySelector('option[value="custom"]');
        if (customOption) {
            customOption.remove();
        }
    }

    // トースト通知を表示
    function showToast(message) {
        // 既存のトーストを削除
        const existingToast = document.getElementById('toastMessage');
        if (existingToast) {
            existingToast.remove();
        }
        
        // 新しいトーストを作成
        const toast = document.createElement('div');
        toast.id = 'toastMessage';
        toast.className = 'toast-message';
        toast.textContent = message;
        
        // ドキュメントに追加
        document.body.appendChild(toast);
        
        // 一定時間後に自動的に消去
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 500);
        }, 2000);
    }

    // レイアウトパターンの生成
    function generateLayouts() {
        const layouts = [];
        
        if (images.length === 1) {
            // 1枚の場合は全画面表示
            layouts.push({
                type: 'single',
                positions: [
                    { x: 0, y: 0, width: 1, height: 1 }
                ]
            });
        } else if (images.length === 2) {
            // 2枚のレイアウト
            layouts.push({
                type: 'vertical-2',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: 'horizontal-2',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        } else if (images.length === 3) {
            // 3枚のレイアウト
            layouts.push({
                type: 'vertical-3',
                positions: [
                    { x: 0, y: 0, width: 1, height: 1/3 },
                    { x: 0, y: 1/3, width: 1, height: 1/3 },
                    { x: 0, y: 2/3, width: 1, height: 1/3 }
                ]
            });
            layouts.push({
                type: 'horizontal-3',
                positions: [
                    { x: 0, y: 0, width: 1/3, height: 1 },
                    { x: 1/3, y: 0, width: 1/3, height: 1 },
                    { x: 2/3, y: 0, width: 1/3, height: 1 }
                ]
            });
            layouts.push({
                type: '1-top-2-bottom',
                positions: [
                    { x: 0, y: 0, width: 1, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-top-1-bottom',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 1, height: 0.5 }
                ]
            });
            layouts.push({
                type: '1-left-2-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 1 },
                    { x: 0.5, y: 0, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0.5, width: 0.5, height: 0.5 }
                ]
            });
            layouts.push({
                type: '2-left-1-right',
                positions: [
                    { x: 0, y: 0, width: 0.5, height: 0.5 },
                    { x: 0, y: 0.5, width: 0.5, height: 0.5 },
                    { x: 0.5, y: 0, width: 0.5, height: 1 }
                ]
            });
        }

        return layouts;
    }

    // 位置調整モードのイベントリスナーを設定
    function setupPositionAdjustEventListeners() {
        // マウスイベント - プレビュー画像に直接イベントを追加
        mainPreview.addEventListener('mousedown', handleDragStart, { passive: false });
        document.addEventListener('mousemove', handleDragMove, { passive: false });
        document.addEventListener('mouseup', handleDragEnd);
        
        // タッチイベント（モバイル対応）
        mainPreview.addEventListener('touchstart', handleDragStart, { passive: false });
        document.addEventListener('touchmove', handleDragMove, { passive: false });
        document.addEventListener('touchend', handleDragEnd);
    }

    // 位置調整モードのイベントリスナーを削除
    function removePositionAdjustEventListeners() {
        // マウスイベント
        mainPreview.removeEventListener('mousedown', handleDragStart);
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        
        // タッチイベント
        mainPreview.removeEventListener('touchstart', handleDragStart);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
    }

    // ドラッグ開始時の処理
    function handleDragStart(e) {
        e.preventDefault(); // デフォルト動作を防止
        
        // 位置調整モードがアクティブでない場合は何もしない
        if (!isAdjustMode || selectedImageIndex === -1) return;

        // ドラッグ開始フラグをセット
        isDragging = true;
        
        // タッチイベントかマウスイベントかを判断
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // ドラッグ開始位置を記録
        dragStartX = clientX;
        dragStartY = clientY;
        
        // 現在のオフセットを取得または初期化
        if (!imagePositionOffsets[selectedImageIndex]) {
            imagePositionOffsets[selectedImageIndex] = { x: 0, y: 0 };
        }
        
        // 現在のオフセットを記録
        currentOffsetX = imagePositionOffsets[selectedImageIndex].x;
        currentOffsetY = imagePositionOffsets[selectedImageIndex].y;
    }
    
    // ドラッグ中処理
    function handleDragMove(e) {
        // ドラッグ中でなければ何もしない
        if (!isDragging) return;
        
        e.preventDefault(); // デフォルト動作を防止（スクロールなど）
        
        // タッチイベントかマウスイベントかを判断
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // ドラッグ開始位置からの移動量を計算
        const deltaX = clientX - dragStartX;
        const deltaY = clientY - dragStartY;
        
        // 移動量を画像オフセットに変換（反対方向に動かす）
        // 感度を調整するための係数 - 値が小さいほど敏感になる
        const sensitivity = 50; // この値は調整可能
        
        // 新しいオフセットを計算（範囲制限も適用）
        const newOffsetX = Math.max(-100, Math.min(100, currentOffsetX - deltaX / sensitivity * 100));
        const newOffsetY = Math.max(-100, Math.min(100, currentOffsetY - deltaY / sensitivity * 100));
        
        // オフセットを適用
        imagePositionOffsets[selectedImageIndex] = {
            x: newOffsetX,
            y: newOffsetY
        };
        
        // コラージュを更新
        updateCollage();
    }

    // ドラッグ終了時の処理
    function handleDragEnd(e) {
        // ドラッグ中でなければ何もしない
        if (!isDragging) return;
        
        // ドラッグ終了フラグをリセット
        isDragging = false;
        
        // 最終的なオフセットを記録（位置調整モードは継続）
        if (selectedImageIndex !== -1) {
            currentOffsetX = imagePositionOffsets[selectedImageIndex].x;
            currentOffsetY = imagePositionOffsets[selectedImageIndex].y;
            
            // 変更があったことをユーザーに通知
            showToast('Image position adjusted');
        }

        // ドラッグ操作終了後もモードは継続（位置調整アイコンをクリックするまで）
    }

    // 位置調整モードの表示を更新する関数
    function updateAdjustModeView() {
        // 選択画像のハイライト枠を赤色に変更
        if (highlightElement) {
            highlightElement.style.border = '3px solid #e74c3c';
        } else {
            // ハイライトがなければ作成
            highlightSelectedImage(selectedImageIndex);
            if (highlightElement) {
                highlightElement.style.border = '3px solid #e74c3c';
            }
        }
        
        // オーバーレイを作成して表示
        createAdjustOverlay();
    }
    
    // 位置調整モード用のオーバーレイを作成
    function createAdjustOverlay() {
        // 既存のオーバーレイを削除
        removeAdjustOverlay();
        
        if (!isAdjustMode || selectedImageIndex === -1) return;
        
        const previewContainer = mainPreview.parentElement;
        
        // プレビュー要素の位置情報を取得
        const previewRect = mainPreview.getBoundingClientRect();
        const containerRect = previewContainer.getBoundingClientRect();
        const previewOffsetX = previewRect.left - containerRect.left;
        const previewOffsetY = previewRect.top - containerRect.top;
        
        // オーバーレイ要素の作成
        adjustOverlayElement = document.createElement('div');
        adjustOverlayElement.id = 'adjustModeOverlay';
        adjustOverlayElement.style.position = 'absolute';
        adjustOverlayElement.style.left = `${previewOffsetX}px`;
        adjustOverlayElement.style.top = `${previewOffsetY}px`;
        adjustOverlayElement.style.width = `${mainPreview.width}px`;
        adjustOverlayElement.style.height = `${mainPreview.height}px`;
        adjustOverlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'; // 半透明の黒
        adjustOverlayElement.style.zIndex = '4'; // ハイライト要素より下
        adjustOverlayElement.style.pointerEvents = 'none'; // マウスイベントを通過させる
        
        // オーバーレイを適用
        previewContainer.appendChild(adjustOverlayElement);
        mainPreview.style.zIndex = '3'; // メインプレビューがオーバーレイに隠れないようにする
    }
    
    // 位置調整モード用のオーバーレイを削除
    function removeAdjustOverlay() {
        // オーバーレイ要素が存在すれば削除
        if (adjustOverlayElement) {
            adjustOverlayElement.remove();
            adjustOverlayElement = null;
        }
        
        // 他のオーバーレイも念のため削除
        const overlay = document.getElementById('adjustModeOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
});
