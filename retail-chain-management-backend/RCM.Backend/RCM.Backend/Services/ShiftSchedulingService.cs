using Microsoft.EntityFrameworkCore;
using RCM.Backend.Models;
using System.Globalization;

public class ShiftSchedulingService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public ShiftSchedulingService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<RetailChainContext>();
                ScheduleShifts(context);
            }

            TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            DateTime vietnamNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            DateTime nextRun = vietnamNow.Date.AddHours(6); // Chạy lúc 6:00 AM
            if (vietnamNow > nextRun)
            {
                nextRun = nextRun.AddDays(1); // Chuyển sang 6:00 AM ngày tiếp theo
            }

            TimeSpan delay = nextRun - vietnamNow;
            await Task.Delay(delay, stoppingToken);
        }
    }

    private void ScheduleShifts(RetailChainContext context)
    {
        TimeZoneInfo vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        DateTime vietnamNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
        int currentMonth = vietnamNow.Month;
        int currentYear = vietnamNow.Year;
        Calendar calendar = CultureInfo.InvariantCulture.Calendar;
        int currentWeek = calendar.GetWeekOfYear(vietnamNow, CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);

        var shiftSetting = context.ShiftSettings
            .FirstOrDefault(s => s.Month == currentMonth && s.Year == currentYear);

        if (shiftSetting == null)
        {
            return;
        }

        int totalShiftsPerMonth = shiftSetting.TotalShifts;
        var staffList = context.Employees
            .Join(context.Accounts,
                  e => e.AccountId,
                  a => a.AccountId,
                  (e, a) => new { Employee = e, Account = a })
            .Where(ea => ea.Account.Role == "Staff" && ea.Employee.IsActive == true)
            .Select(ea => new
            {
                ea.Employee.EmployeeId,
                ea.Employee.FullName,
                CurrentShiftId = ea.Employee.WorkShiftId
            })
            .ToList();

        const int morningShiftId = 1;
        const int afternoonShiftId = 2;
        int shiftsAssigned = 0;

        foreach (var staff in staffList)
        {
            if (shiftsAssigned >= totalShiftsPerMonth * staffList.Count)
            {
                break;
            }

            int newShiftId = (currentWeek % 2 == 0) ? morningShiftId : afternoonShiftId;
            var employee = context.Employees.FirstOrDefault(e => e.EmployeeId == staff.EmployeeId);
            if (employee != null && employee.WorkShiftId != newShiftId)
            {
                employee.WorkShiftId = newShiftId;
                shiftsAssigned++;
            }
        }

        context.SaveChanges();
    }
}