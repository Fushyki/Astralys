import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\dabiv\Downloads\Calc Sheet.xlsx', data_only=True)

def inspect_sheet_structure(sheetname):
    ws = wb[sheetname]
    print(f"\n=======================================================")
    print(f"SHEET: {sheetname}")
    print(f"=======================================================")
    
    # Find all character row blocks or team blocks
    # Look for rows where row+1 or row+2 has character names
    # Or look for rows containing 'Damage' or 'DMGTotal' or 'DPS'
    dps_rows = []
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            val = ws.cell(r, c).value
            if val is not None and isinstance(val, str):
                v_clean = val.strip().lower()
                if v_clean in ['dmgtotal', 'dpr', 'dps', 'dps(18)', 'dps(16)', 'dps(20)', 'dps(17,8)']:
                    dps_rows.append((r, c, val))
    
    print(f"Key metric cells in {sheetname}:")
    for r, c, val in dps_rows[:15]:
        col_letter = openpyxl.utils.get_column_letter(c)
        val_next = ws.cell(r, c+1).value
        print(f"  {col_letter}{r}: {val} -> {val_next}")

for s in wb.sheetnames:
    inspect_sheet_structure(s)
