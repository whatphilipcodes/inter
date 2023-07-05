# -*- mode: python ; coding: utf-8 -*-
# import sys ; sys.setrecursionlimit(sys.getrecursionlimit() * 5)

from PyInstaller.utils.hooks import collect_dynamic_libs
from PyInstaller.utils.hooks import collect_data_files
from PyInstaller.utils.hooks import copy_metadata
# from PyInstaller.utils.hooks import collect_all


datas = []
datas += copy_metadata('tqdm')
datas += copy_metadata('regex')
datas += copy_metadata('requests')
datas += copy_metadata('packaging')
datas += copy_metadata('filelock')
datas += copy_metadata('numpy')
datas += copy_metadata('tokenizers')
datas += copy_metadata('torch')
datas += copy_metadata('transformers')
datas += copy_metadata('accelerate')
datas += copy_metadata('sentencepiece')
datas += copy_metadata('pyarrow')

datas += [('resources_dev', 'resources')]

datas += collect_data_files('torch', include_py_files=True, includes=['**/*.py'])
datas += collect_data_files('pyarrow', include_py_files=True, includes=['**/*.py'])
datas += collect_data_files('sentencepiece', include_py_files=True, includes=['**/*.py'])
datas += collect_data_files('transformers', include_py_files=True, includes=['**/*.py'])
datas += collect_data_files('accelerate', include_py_files=True, includes=['**/*.py'])
datas += collect_data_files('datasets', include_py_files=True, includes=['**/*.py'])

binaries = []
binaries += collect_dynamic_libs('sentencepiece')
binaries += collect_dynamic_libs('pyarrow')

hiddenimports = []
hiddenimports += 'sentencepiece'
hiddenimports += 'pyarrow'


block_cipher = None


a = Analysis(
    ['entry.py'],
    pathex=[],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='backend',
)
