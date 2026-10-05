import openpyxl

wb = openpyxl.load_workbook(r'C:\Users\dabiv\Downloads\Calc Sheet.xlsx', data_only=True)

for sheetname in wb.sheetnames:
    ws = wb[sheetname]
    print(f"\n==================== SHEET: {sheetname} ====================")
    # Search for any cell containing 'Character' or 'DPR'
    found_blocks = []
    for r in range(1, ws.max_row + 1):
        for c in range(1, ws.max_column + 1):
            v = ws.cell(r, c).value
            if v and isinstance(v, str):
                v_clean = v.strip().lower()
                if v_clean in ['character', 'dpr', 'rotation', 'time esped']:
                    col_letter = openpyxl.utils.get_column_letter(c)
                    found_blocks.append((r, c, col_letter, v))
    for r, c, col_letter, v in found_blocks:
        # print the row
        row_vals = [f"{openpyxl.utils.get_column_letter(ci)}{r}: {ws.cell(r, ci).value}" for ci in range(c, min(c+7, ws.max_column+1)) if ws.cell(r, ci).value is not None]
        print(f"  Row {r:3d} ({col_letter}{r}='{v}'): " + " | ".join(row_vals))
