using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SQLite;

namespace RetailMobile.Data;

public class DatabaseService
{
    public SQLiteAsyncConnection Db { get; }
    public DatabaseService()
    {
        SQLitePCL.Batteries_V2.Init();  // Bắt buộc trên Android/iOS

        var dbPath = GetDbPath();
        Db = new SQLiteAsyncConnection(dbPath);

        InitTables();
    }

    private async void InitTables()
    {
        await Db.CreateTableAsync<Models.CartItem>();
        await Db.CreateTableAsync<Models.TokenRecord>();
    }

    private string GetDbPath()
    {
#if ANDROID
        string dbPath = Path.Combine(Android.App.Application.Context.FilesDir.Path, "app.db3");
#elif IOS
        string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), "app.db3");
#else
        string dbPath = Path.Combine(Windows.Storage.ApplicationData.Current.LocalFolder.Path, "app.db3");
#endif

        return dbPath;
    }
}
