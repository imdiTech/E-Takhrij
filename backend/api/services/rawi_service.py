from api.core.data import get_rawi_df

def get_rawi_by_indices(indices):
    """
    Mengambil profil lengkap dari masing-masing perawi berdasarkan daftar indeks.
    Mengakses memori (RAM) melalui getter get_rawi_df() untuk efisiensi.
    """
    df = get_rawi_df()
    
    # Validasi jika kerangka data kosong atau list indices tidak valid
    if df is None or df.empty or not indices:
        return []

    # Memastikan parameter indices berupa list integer
    try:
        clean_indices = [int(idx) for idx in indices]
    except (ValueError, TypeError):
        return []

    # Memfilter baris data yang nilai kolom 'scholar_indx'-nya ada di dalam daftar
    filtered_df = df[df["scholar_indx"].isin(clean_indices)]

    # Mengubah kerangka data Pandas hasil filter menjadi format list of dictionaries
    rawi_profiles = filtered_df.to_dict(orient="records")
    
    return rawi_profiles

def get_rawi_map():
    """
    Mengembalikan pemetaan (dictionary) menyeluruh dari scholar_indx ke profil perawi.
    Sangat berguna untuk pencarian relasi guru-murid secara instan (O(1)).
    """
    df = get_rawi_df()
    
    if df is None or df.empty:
        return {}

    # Mengonversi seluruh baris menjadi dictionary
    profiles = df.to_dict(orient="records")
    
    # Membangun pemetaan dengan scholar_indx sebagai kunci (key)
    rawi_map = {rawi["scholar_indx"]: rawi for rawi in profiles}
    
    return rawi_map