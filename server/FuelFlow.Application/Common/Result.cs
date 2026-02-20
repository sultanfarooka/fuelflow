namespace FuelFlow.Application.Common;

/// <summary>
/// A generic wrapper for service return values.
/// 
/// WHY not just throw exceptions?
/// - Exceptions are for EXCEPTIONAL situations (database down, null reference)
/// - "Email already exists" is not exceptional — it's a normal business case
/// - Result lets the caller decide how to handle success/failure cleanly
/// - It's also more explicit — you can see from the return type that this
///   operation might fail
/// 
/// HOW it works:
///   var result = Result<User>.Success(user);       // happy path
///   var result = Result<User>.Failure("Not found"); // sad path
///   
///   if (result.IsSuccess) { use result.Data }
///   else { show result.Error }
/// </summary>
public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string? Error { get; private set; }

    private Result() { }

    public static Result<T> Success(T data) => new()
    {
        IsSuccess = true,
        Data = data
    };

    public static Result<T> Failure(string error) => new()
    {
        IsSuccess = false,
        Error = error
    };
}
