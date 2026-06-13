"""
AI Chat views — DRF implementation.
"""
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from api.services.rag_service import generate_answer


@api_view(['GET'])
@permission_classes([AllowAny])
def chat_interface(request):
    return Response({"message": "AI Chat API ready"})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def ask(request):
    data = request.data

    query = data.get('query')
    if not query:
        return Response({'error': 'Query is required'}, status=400)

    answer = generate_answer(query)
    return Response({'answer': answer})
